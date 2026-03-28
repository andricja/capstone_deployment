<?php

namespace App\Data;

class OrientalMindoroAddresses
{
    /**
     * Get all municipalities in Oriental Mindoro with their barangays.
     *
     * @return array
     */
    public static function getMunicipalities(): array
    {
        return [
            'Baco' => [
                'Alag', 'Bangkatan', 'Baras', 'Bayanan', 'Catwiran', 'Dulangan', 'Lantuyang',
                'Lumang Bayan', 'Malapad', 'Mangangan-Baybay', 'Mangangan-Poblacion', 'Mayabig',
                'Pambisan', 'Poblacion', 'Pulang-Tubig', 'Putican-Cabulo', 'San Andres',
                'San Ignacio', 'San Isidro (Lumangbayan)', 'Santa Cruz', 'Santa Rosa I',
                'Santa Rosa II', 'Tabon-tabon', 'Tagumpay', 'Water', 'Dulangan I', 'Dulangan II'
            ],
            'Bansud' => [
                'Alcadesma', 'Bato', 'Conrazon', 'Malo', 'Manihala', 'Pag-Asa', 'Poblacion',
                'Proper Bansud', 'Rosacara', 'Salcedo', 'Sumagui', 'Villa Pag-Asa'
            ],
            'Bongabong' => [
                'Anilao', 'Aplaya', 'Bagumbayan', 'Batangan', 'Bukal', 'Camantigue', 'Carmundo',
                'Dayhagan', 'Formon', 'Hagan', 'Ipil', 'Labasan', 'Labonan', 'Libertad',
                'Lisap', 'Maliig', 'Mapang', 'Masaguisi', 'Ogbot', 'Orconuma', 'Poblacion',
                'Sagana', 'San Isidro', 'San Jose', 'San Juan', 'Sigange', 'Tawas'
            ],
            'Bulalacao' => [
                'Balatasan', 'Benli (Mangyan Minority)', 'Cabugao', 'Cambunang', 'Maasin',
                'Maujao', 'Milagrosa', 'Nasukob', 'Poblacion', 'San Francisco', 'San Isidro',
                'San Juan', 'San Pedro', 'San Roque'
            ],
            'Calapan City' => [
                'Balingayan', 'Balite', 'Baruyan', 'Batino', 'Bayanan I', 'Bayanan II',
                'Biga', 'Bondoc', 'Bucayao', 'Buhuan', 'Bulusan', 'Calero', 'Camansihan',
                'Camilmil', 'Canubing I', 'Canubing II', 'Comunal', 'Guinobatan', 'Gulod',
                'Gutad', 'Ibaba East', 'Ibaba West', 'Ilaya', 'Lalud', 'Lazareto', 'Libis',
                'Lumang Bayan', 'Mahal na Pangalan', 'Malad', 'Malamig', 'Managpi', 'Masipit',
                'Nag-iba I', 'Nag-iba II', 'Pachoca', 'Palhi', 'Panggalaan', 'Parang',
                'Patas', 'Personas', 'Poblacion', 'Putingtubig', 'Salong', 'San Antonio',
                'San Vicente Central', 'San Vicente East', 'San Vicente North', 'San Vicente South',
                'San Vicente West', 'Santa Cruz', 'Santa Isabel', 'Santa Maria Village',
                'Santa Rita', 'Santo Niño', 'Sapul', 'Silonay', 'Suqui', 'Tawagan', 'Tawiran',
                'Tibag', 'Wawa'
            ],
            'Gloria' => [
                'Agsalin', 'Agos', 'Alma Villa', 'Andres Bonifacio', 'Balete', 'Banus',
                'Banutan', 'Buong Lupa', 'Gaudencio Antonino', 'Guimbonan', 'Kawit', 'Lucio Laurel',
                'Macario Adriatico', 'Malamig', 'Malayak', 'Maligaya', 'Malubay', 'Manguyang',
                'Mirayan', 'Narra', 'Papandungin', 'Poblacion', 'Santa Maria', 'Santa Theresa',
                'Tambong'
            ],
            'Mansalay' => [
                'Balugo', 'Bonbon', 'Budburan', 'Don Pedro', 'Manaul', 'Maningcol', 'Panaytayan',
                'Poblacion', 'Roma', 'Santa Brigida', 'Santa Maria', 'Villa Celestial',
                'Wasig', 'Waygan'
            ],
            'Naujan' => [
                'Adrialuna', 'Andres Ylagan', 'Antipolo', 'Apitong', 'Aurora', 'Bacungan',
                'Bagong Buhay', 'Bancuro', 'Barcenaga', 'Bayani', 'Buhangin', 'Concepcion',
                'Dao', 'Del Pilar', 'Estrella', 'General Esco', 'Herrera', 'Inarawan',
                'Kalinisan', 'Laguna', 'Mabini', 'Magtibay', 'Malaya', 'Malinao', 'Malvar',
                'Masagana', 'Masaguing', 'Melgar A', 'Melgar B', 'Metolza', 'Montelago',
                'Montemayor', 'Motoderazo', 'Mulawin', 'Nag-Iba I', 'Nag-Iba II', 'Pagkakaisa',
                'Paniquian', 'Pinagsabangan', 'Poblacion I', 'Poblacion II', 'Poblacion III',
                'Sampaguita', 'San Agustin I', 'San Agustin II', 'San Antonio', 'San Carlos',
                'San Isidro', 'San Jose', 'San Luis', 'San Nicolas', 'San Pedro', 'Santa Cruz',
                'Santa Isabel', 'Santa Maria', 'Santiago', 'Santo Niño', 'Tagumpay'
            ],
            'Pinamalayan' => [
                'Anoling', 'Bacungan', 'Bangbang', 'Banilad', 'Buli', 'Calingag', 'Camansihan',
                'Guinhawa', 'Lumambayan', 'Mabuhay', 'Malaya', 'Maningcol', 'Marfrancisco',
                'Nabuslot', 'Pagalagala', 'Palayan', 'Pambisan', 'Panggulayan', 'Papandayan',
                'Pili', 'Poblacion', 'Quinabigan', 'Ranzo', 'Rosario', 'Sabang', 'Santa Isabel',
                'Santa Maria', 'Santa Rita', 'Santo Niño', 'Wawa'
            ],
            'Pola' => [
                'Bacawan', 'Bacungan', 'Batuhan', 'Bayanan', 'Biga', 'Buhay na Tubig',
                'Calima', 'Calubasanhon', 'Campamento', 'Casiligan', 'Malibago', 'Maluanluan',
                'Matulatula', 'Misong', 'Pahilahan', 'Panikihan', 'Pula', 'Puting Cacao',
                'Tagbakin', 'Tagumpay', 'Tiguihan', 'Zone I (Pob.)', 'Zone II (Pob.)'
            ],
            'Puerto Galera' => [
                'Aninuan', 'Balatero', 'Dulangan', 'Palangan', 'Poblacion', 'Sabang',
                'San Antonio', 'San Isidro', 'Sinandigan', 'Tabinay', 'Villaflor', 'White Beach',
                'Caguray'
            ],
            'Roxas' => [
                'Bagumbayan', 'Cantil', 'Dangay', 'Mabuhay', 'Mabini', 'Mapaya', 'Maraska',
                'Odiong', 'Poblacion', 'San Aquilino', 'San Isidro', 'San Jose', 'San Mariano',
                'San Miguel', 'San Rafael', 'San Roque', 'San Vicente', 'Victoria'
            ],
            'San Teodoro' => [
                'Bigaan', 'Calangatan', 'Capayas', 'Cawayan', 'Ilag', 'Lumangbayan', 'Poblacion',
                'Tacligan'
            ],
            'Socorro' => [
                'Batong Dalig', 'Bayuin', 'Bugtong na Tuog', 'Calocmoy', 'Catiningan', 'Fortuna',
                'La Fortuna', 'Leuteboro I', 'Leuteboro II', 'Mabuhay I', 'Mabuhay II', 'Malugay',
                'Matungao', 'Monteverde', 'Pasi I', 'Pasi II', 'Poblacion', 'San Isidro'
            ],
            'Victoria' => [
                'Alcate', 'Antonino', 'Bagong Buhay', 'Bambanin', 'Banahaw', 'Canaan',
                'Concepcion', 'Loyola', 'Macatoc', 'Malabrigo', 'Malayas', 'Ordovilla',
                'Pakyas', 'Poblacion I', 'Poblacion II', 'Poblacion III', 'San Antonio',
                'San Francisco', 'San Gabriel', 'San Gelacio', 'San Isidro', 'San Juan',
                'San Pedro', 'San Roque', 'Santa Maria'
            ],
        ];
    }

    /**
     * Get list of municipality names only.
     *
     * @return array
     */
    public static function getMunicipalityNames(): array
    {
        return array_keys(self::getMunicipalities());
    }

    /**
     * Get barangays for a specific municipality.
     *
     * @param string $municipality
     * @return array
     */
    public static function getBarangays(string $municipality): array
    {
        $municipalities = self::getMunicipalities();
        return $municipalities[$municipality] ?? [];
    }

    /**
     * Validate if municipality exists.
     *
     * @param string $municipality
     * @return bool
     */
    public static function isValidMunicipality(string $municipality): bool
    {
        return array_key_exists($municipality, self::getMunicipalities());
    }

    /**
     * Validate if barangay exists in municipality.
     *
     * @param string $municipality
     * @param string $barangay
     * @return bool
     */
    public static function isValidBarangay(string $municipality, string $barangay): bool
    {
        $barangays = self::getBarangays($municipality);
        return in_array($barangay, $barangays);
    }
}
