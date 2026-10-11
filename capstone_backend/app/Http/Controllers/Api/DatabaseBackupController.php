<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Response;

class DatabaseBackupController extends Controller
{
    /**
     * Export all database tables as SQL backup
     * Admin only
     */
    public function export(Request $request)
    {
        try {
            // Get database configuration
            $database = config('database.connections.mysql.database');
            
            // Create filename with timestamp
            $filename = 'ferms_backup_' . date('Y-m-d_His') . '.sql';
            
            // Create SQL backup using PHP
            $sql = $this->generateSqlBackup($database);
            
            // Log the backup action
            try {
                DB::table('audit_logs')->insert([
                    'user_id' => auth()->id(),
                    'action' => 'database_backup_export',
                    'model_type' => 'Database',
                    'model_id' => null,
                    'changes' => json_encode([
                        'filename' => $filename,
                        'size' => strlen($sql),
                    ]),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } catch (\Exception $e) {
                // Continue even if logging fails
            }
            
            // Return SQL file as download
            return Response::make($sql, 200, [
                'Content-Type' => 'application/sql',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Content-Length' => strlen($sql),
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Database backup failed: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to create database backup',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Generate SQL backup using PHP
     */
    private function generateSqlBackup($database): string
    {
        $sql = "-- FERMs Database Backup\n";
        $sql .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
        $sql .= "-- Database: {$database}\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n";
        $sql .= "SET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n";
        $sql .= "SET time_zone = \"+00:00\";\n\n";
        
        // Get all tables
        $tables = DB::select('SHOW TABLES');
        $tableKey = 'Tables_in_' . $database;
        
        foreach ($tables as $table) {
            $tableName = $table->$tableKey;
            
            try {
                // Get CREATE TABLE statement
                $createTableResult = DB::select("SHOW CREATE TABLE `{$tableName}`");
                $sql .= "\n-- Table structure for table `{$tableName}`\n";
                $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
                $sql .= $createTableResult[0]->{'Create Table'} . ";\n\n";
                
                // Get table data
                $rows = DB::table($tableName)->get();
                
                if ($rows->count() > 0) {
                    $sql .= "-- Dumping data for table `{$tableName}`\n";
                    
                    foreach ($rows as $row) {
                        $values = [];
                        foreach ((array)$row as $value) {
                            if ($value === null) {
                                $values[] = 'NULL';
                            } elseif (is_numeric($value)) {
                                $values[] = $value;
                            } else {
                                $values[] = "'" . addslashes($value) . "'";
                            }
                        }
                        $sql .= "INSERT INTO `{$tableName}` VALUES (" . implode(', ', $values) . ");\n";
                    }
                    $sql .= "\n";
                }
            } catch (\Exception $e) {
                $sql .= "-- Error backing up table `{$tableName}`: " . $e->getMessage() . "\n\n";
            }
        }
        
        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
        
        return $sql;
    }
    
    /**
     * Get backup statistics
     * Admin only
     */
    public function stats(): JsonResponse
    {
        try {
            $database = config('database.connections.mysql.database');
            
            // Get table statistics
            $tables = DB::select('SHOW TABLE STATUS');
            $totalSize = 0;
            $totalRows = 0;
            $tableStats = [];
            
            foreach ($tables as $table) {
                $size = ($table->Data_length ?? 0) + ($table->Index_length ?? 0);
                $totalSize += $size;
                $totalRows += $table->Rows ?? 0;
                
                $tableStats[] = [
                    'name' => $table->Name,
                    'rows' => number_format($table->Rows ?? 0),
                    'size' => $this->formatBytes($size),
                    'engine' => $table->Engine ?? 'Unknown',
                ];
            }
            
            return response()->json([
                'database' => $database,
                'total_tables' => count($tables),
                'total_rows' => number_format($totalRows),
                'total_size' => $this->formatBytes($totalSize),
                'tables' => $tableStats,
                'recent_backups' => [],
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Backup stats failed: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to get backup statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Import database from SQL file
     * Admin only
     */
    public function import(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'sql_file' => 'required|file|mimes:sql,txt|max:102400', // Max 100MB
            ]);
            
            $file = $request->file('sql_file');
            $sqlContent = file_get_contents($file->getRealPath());
            
            // Split SQL into individual statements
            $statements = array_filter(
                array_map('trim', explode(';', $sqlContent)),
                function($statement) {
                    return !empty($statement) && !preg_match('/^--/', $statement);
                }
            );
            
            // Disable foreign key checks temporarily
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            
            $executedCount = 0;
            $errors = [];
            
            // Execute each statement
            foreach ($statements as $statement) {
                if (empty(trim($statement))) {
                    continue;
                }
                
                try {
                    DB::statement($statement);
                    $executedCount++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'statement' => substr($statement, 0, 100) . '...',
                        'error' => $e->getMessage(),
                    ];
                }
            }
            
            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
            
            // Log the import action
            try {
                DB::table('audit_logs')->insert([
                    'user_id' => auth()->id(),
                    'action' => 'database_backup_import',
                    'model_type' => 'Database',
                    'model_id' => null,
                    'changes' => json_encode([
                        'filename' => $file->getClientOriginalName(),
                        'statements_executed' => $executedCount,
                        'errors_count' => count($errors),
                    ]),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } catch (\Exception $e) {
                // Continue even if logging fails
            }
            
            if (count($errors) > 0) {
                return response()->json([
                    'message' => "Database imported with {$executedCount} statements executed, but " . count($errors) . " errors occurred.",
                    'executed' => $executedCount,
                    'errors' => $errors,
                ], 206); // Partial success
            }
            
            return response()->json([
                'message' => 'Database imported successfully!',
                'executed' => $executedCount,
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Database import failed: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to import database',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
