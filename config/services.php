<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    // Base URL storage portal Career MAI untuk menampilkan foto/berkas kandidat.
    // Berkas ada di {asset_url}/uploads/{folder}/{nama_file} (folder: foto, cv, ijazah,
    // transkrip, interview, panel, psikogram). Config-cache safe. Pakai nama env khusus
    // (BUKAN ASSET_URL bawaan Laravel yang dipakai asset()/Vite aplikasi ini sendiri).
    'career_mai' => [
        'asset_url' => env('CAREER_MAI_ASSET_URL', 'https://career.mekararmadainvestama.co.id/public'),
    ],

];
