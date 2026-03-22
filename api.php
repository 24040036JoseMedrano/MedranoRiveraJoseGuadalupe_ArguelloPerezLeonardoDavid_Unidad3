<?php
/**
 * api.php — Backend completo del Mashup Dashboard
 * Llamar con: api.php?route=geo/search&q=mexico
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// ── Helpers ───────────────────────────────────────────────
function ok($data) {
    echo json_encode(array_merge(['ok' => true], $data), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function fail($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}
function get_url($url, $browser = false) {
    $ua = $browser
        ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36'
        : 'MashupPHP/1.0';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_HTTPHEADER     => ["User-Agent: $ua", "Accept: application/json"],
    ]);
    $r = curl_exec($ch);
    curl_close($ch);
    return json_decode($r, true) ?? [];
}
function body() { return json_decode(file_get_contents('php://input'), true) ?? []; }

// ── Base de datos JSON ────────────────────────────────────
define('DB_FILE', __DIR__ . '/db.json');
function db_load() {
    if (!file_exists(DB_FILE)) file_put_contents(DB_FILE, '{"users":[],"messages":[],"log":[]}');
    return json_decode(file_get_contents(DB_FILE), true);
}
function db_save($d) { file_put_contents(DB_FILE, json_encode($d, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)); }
function db_insert($col, $rec) {
    $db = db_load();
    $rec = array_merge($rec, ['_id' => substr(md5(uniqid()), 0, 8), 'createdAt' => date('c')]);
    $db[$col][] = $rec;
    $db['log'][] = ['action' => 'INSERT', 'collection' => $col, '_id' => $rec['_id'], 'ts' => date('c')];
    db_save($db);
    return $rec;
}

// ── Router ────────────────────────────────────────────────
$route  = $_GET['route'] ?? '';
$method = strtoupper($_SERVER['REQUEST_METHOD']);

// ══════════════════════════════════════════════════════════
// 1. GEOLOCALIZACIÓN — OpenStreetMap Nominatim
// ══════════════════════════════════════════════════════════
if ($route === 'geo/search') {
    $q = $_GET['q'] ?? 'Mexico City';
    $d = get_url('https://nominatim.openstreetmap.org/search?q='.urlencode($q).'&format=json&limit=5&addressdetails=1');
    ok(['results' => $d]);
}
if ($route === 'geo/reverse') {
    $d = get_url('https://nominatim.openstreetmap.org/reverse?lat='.($_GET['lat']??'19.43').'&lon='.($_GET['lon']??'-99.13').'&format=json');
    ok(['result' => $d]);
}

// ══════════════════════════════════════════════════════════
// 2. REDDIT — API Pública
// ══════════════════════════════════════════════════════════
if ($route === 'reddit/subreddits') {
    ok(['subreddits' => [
        ['name'=>'mexico',       'icon'=>'🇲🇽','color'=>'#ef4444','desc'=>'Todo sobre México'],
        ['name'=>'programacion', 'icon'=>'💻', 'color'=>'#3b82f6','desc'=>'Programación en español'],
        ['name'=>'gaming',       'icon'=>'🎮', 'color'=>'#8b5cf6','desc'=>'Videojuegos'],
        ['name'=>'memes',        'icon'=>'😂', 'color'=>'#f59e0b','desc'=>'Los mejores memes'],
        ['name'=>'worldnews',    'icon'=>'🌍', 'color'=>'#10b981','desc'=>'Noticias del mundo'],
        ['name'=>'technology',   'icon'=>'🤖', 'color'=>'#06b6d4','desc'=>'Tecnología'],
        ['name'=>'movies',       'icon'=>'🎬', 'color'=>'#f43f5e','desc'=>'Películas'],
        ['name'=>'music',        'icon'=>'🎵', 'color'=>'#a855f7','desc'=>'Música'],
        ['name'=>'space',        'icon'=>'🚀', 'color'=>'#6366f1','desc'=>'Espacio'],
        ['name'=>'funny',        'icon'=>'🤣', 'color'=>'#eab308','desc'=>'Humor'],
        ['name'=>'sports',       'icon'=>'⚽', 'color'=>'#22c55e','desc'=>'Deportes'],
        ['name'=>'science',      'icon'=>'🔬', 'color'=>'#0ea5e9','desc'=>'Ciencia'],
    ]]);
}
if ($route === 'reddit/posts') {
    $sub   = preg_replace('/[^a-zA-Z0-9_]/','', $_GET['sub'] ?? 'mexico');
    $sort  = in_array($_GET['sort']??'', ['hot','new','top','rising']) ? $_GET['sort'] : 'hot';
    $limit = min((int)($_GET['limit'] ?? 15), 25);
    $data  = get_url("https://www.reddit.com/r/{$sub}/{$sort}.json?limit={$limit}&raw_json=1", true);
    if (empty($data['data']['children'])) fail("r/$sub no disponible", 404);
    $posts = [];
    foreach ($data['data']['children'] as $c) {
        if ($c['kind'] !== 't3' || !empty($c['data']['over_18'])) continue;
        $p = $c['data'];
        $img = null;
        if (!empty($p['preview']['images'][0]['resolutions'])) {
            foreach ($p['preview']['images'][0]['resolutions'] as $r) {
                if ($r['width'] >= 320) { $img = str_replace('&amp;','&',$r['url']); break; }
            }
        }
        if (!$img && !empty($p['preview']['images'][0]['source']['url']))
            $img = str_replace('&amp;','&',$p['preview']['images'][0]['source']['url']);
        if (!$img && !empty($p['thumbnail']) && strpos($p['thumbnail'],'http')===0)
            $img = $p['thumbnail'];
        $posts[] = [
            'id'          => $p['id'],
            'title'       => $p['title'],
            'author'      => $p['author'],
            'subreddit'   => $p['subreddit'],
            'score'       => $p['score'],
            'upvoteRatio' => $p['upvote_ratio'],
            'numComments' => $p['num_comments'],
            'permalink'   => 'https://reddit.com'.$p['permalink'],
            'selftext'    => mb_substr($p['selftext'] ?? '', 0, 280),
            'image'       => $img,
            'flair'       => $p['link_flair_text'] ?? null,
            'created'     => $p['created_utc'],
        ];
    }
    ok(['subreddit' => $sub, 'sort' => $sort, 'posts' => $posts, 'total' => count($posts)]);
}
if ($route === 'reddit/about') {
    $sub  = preg_replace('/[^a-zA-Z0-9_]/','', $_GET['sub'] ?? 'mexico');
    $data = get_url("https://www.reddit.com/r/{$sub}/about.json?raw_json=1", true);
    if (empty($data['data'])) fail('No encontrado', 404);
    $d = $data['data'];
    ok([
        'name'        => $d['display_name'],
        'title'       => $d['title'],
        'description' => $d['public_description'] ?? '',
        'subscribers' => $d['subscribers'] ?? 0,
        'online'      => $d['accounts_active'] ?? 0,
        'icon'        => str_replace('&amp;','&', $d['icon_img'] ?? $d['community_icon'] ?? ''),
        'color'       => $d['primary_color'] ?? '#ff4500',
    ]);
}
if ($route === 'reddit/search') {
    $q    = $_GET['q'] ?? '';
    if (!$q) fail('q requerido');
    $data = get_url('https://www.reddit.com/subreddits/search.json?q='.urlencode($q).'&limit=8&raw_json=1', true);
    $results = [];
    foreach ($data['data']['children'] ?? [] as $c) {
        $results[] = [
            'name'        => $c['data']['display_name'],
            'subscribers' => $c['data']['subscribers'],
            'description' => $c['data']['public_description'],
            'icon'        => str_replace('&amp;','&', $c['data']['icon_img'] ?? ''),
        ];
    }
    ok(['results' => $results]);
}

// ══════════════════════════════════════════════════════════
// 3. E-COMMERCE — FakeStore API (sin CORS issues)
// ══════════════════════════════════════════════════════════
if ($route === 'shop/products') {
    $q    = strtolower($_GET['q'] ?? '');
    $cat  = $_GET['category'] ?? '';
    $lim  = (int)($_GET['limit'] ?? 12);
    $url  = $cat
        ? 'https://fakestoreapi.com/products/category/'.urlencode($cat).'?limit='.$lim
        : 'https://fakestoreapi.com/products?limit='.$lim;
    $prods = get_url($url);
    if ($q) $prods = array_values(array_filter($prods, fn($p) => stripos($p['title'],$q)!==false || stripos($p['description'],$q)!==false));
    ok(['products' => array_values($prods), 'total' => count($prods)]);
}
if ($route === 'shop/categories') {
    $cats = get_url('https://fakestoreapi.com/products/categories');
    ok(['categories' => $cats]);
}

// ══════════════════════════════════════════════════════════
// 4. BASE DE DATOS — JSON File
// ══════════════════════════════════════════════════════════
if ($route === 'db/users' && $method === 'GET') {
    $db = db_load();
    ok(['users' => $db['users'], 'total' => count($db['users'])]);
}
if ($route === 'db/users' && $method === 'POST') {
    $b = body();
    if (empty($b['username']) || empty($b['email'])) fail('username y email requeridos');
    $db = db_load();
    foreach ($db['users'] as $u) if ($u['email'] === $b['email']) fail('Email ya registrado', 409);
    $rec = db_insert('users', [
        'username' => htmlspecialchars($b['username']),
        'email'    => htmlspecialchars($b['email']),
        'role'     => $b['role'] ?? 'user',
    ]);
    http_response_code(201);
    ok(['user' => $rec, 'message' => 'Usuario registrado']);
}
if (preg_match('#^db/users/([a-f0-9]+)$#', $route, $m) && $method === 'DELETE') {
    $id = $m[1];
    $db = db_load();
    $idx = -1;
    foreach ($db['users'] as $i => $u) if ($u['_id'] === $id) { $idx = $i; break; }
    if ($idx === -1) fail('No encontrado', 404);
    array_splice($db['users'], $idx, 1);
    $db['log'][] = ['action'=>'DELETE','collection'=>'users','_id'=>$id,'ts'=>date('c')];
    db_save($db);
    ok(['message' => 'Eliminado']);
}
if ($route === 'db/log') {
    $db = db_load();
    ok(['log' => array_reverse(array_slice($db['log'], -20))]);
}

// ══════════════════════════════════════════════════════════
// 5. MENSAJERÍA — Simulación
// ══════════════════════════════════════════════════════════
if ($route === 'sms/send' && $method === 'POST') {
    $b = body();
    if (empty($b['to']) || empty($b['message'])) fail('to y message requeridos');
    $channel  = $b['channel'] ?? 'SMS';
    $provider = $channel === 'WhatsApp' ? 'Twilio/WhatsApp' : ($channel === 'Email' ? 'SendGrid' : 'Twilio/SMS');
    $msgId    = 'MSG-'.strtoupper(substr(md5(uniqid()),0,8));
    $rec = db_insert('messages', [
        'to'        => $b['to'],
        'message'   => $b['message'],
        'channel'   => $channel,
        'status'    => 'delivered',
        'messageId' => $msgId,
        'provider'  => $provider,
    ]);
    ok(['sid'=>$msgId,'status'=>'delivered','to'=>$b['to'],'channel'=>$channel,
        'provider'=>$provider,'dateCreated'=>$rec['createdAt'],
        'message'=>"Mensaje $channel enviado exitosamente"]);
}
if ($route === 'sms/history') {
    $db = db_load();
    ok(['messages' => array_reverse(array_slice($db['messages'], -15))]);
}

// ══════════════════════════════════════════════════════════
// 6. STREAMING — Catálogo YouTube
// ══════════════════════════════════════════════════════════
if ($route === 'stream/search') {
    $q = strtolower($_GET['q'] ?? 'lofi');
    $cat = [
        ['id'=>'jfKfPfyJRdk','title'=>'lofi hip hop radio – beats to relax/study to','channel'=>'Lofi Girl','thumb'=>'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg','duration'=>'LIVE'],
        ['id'=>'5qap5aO4i9A','title'=>'lofi hip hop radio – beats to sleep/chill to','channel'=>'Lofi Girl','thumb'=>'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg','duration'=>'LIVE'],
        ['id'=>'DWcJFNfaw9c','title'=>'Jazz & Bossa Nova — Coffee Shop Music','channel'=>'Café Music BGM','thumb'=>'https://i.ytimg.com/vi/DWcJFNfaw9c/hqdefault.jpg','duration'=>'3:45:00'],
        ['id'=>'HuFYqnbVbzY','title'=>'Relaxing Jazz Piano — Autumn Café','channel'=>'Relax Music','thumb'=>'https://i.ytimg.com/vi/HuFYqnbVbzY/hqdefault.jpg','duration'=>'3:00:00'],
        ['id'=>'lTRiuFIWV54','title'=>'Chillhop Music — Spring Radio','channel'=>'Chillhop Music','thumb'=>'https://i.ytimg.com/vi/lTRiuFIWV54/hqdefault.jpg','duration'=>'LIVE'],
        ['id'=>'f02mOEt11OQ','title'=>'Deep Focus — Music for Coding','channel'=>'Yellow Brick Cinema','thumb'=>'https://i.ytimg.com/vi/f02mOEt11OQ/hqdefault.jpg','duration'=>'3:00:00'],
        ['id'=>'77ZozI0rw7w','title'=>'Night Owl Radio — Electronic Beats','channel'=>'Night Owl Radio','thumb'=>'https://i.ytimg.com/vi/77ZozI0rw7w/hqdefault.jpg','duration'=>'LIVE'],
        ['id'=>'UWnZhOMLmAc','title'=>'Peaceful Piano — Sleep Music','channel'=>'Relaxing Piano','thumb'=>'https://i.ytimg.com/vi/UWnZhOMLmAc/hqdefault.jpg','duration'=>'8:00:00'],
    ];
    $r = array_values(array_filter($cat, fn($v) => stripos($v['title'],$q)!==false || stripos($v['channel'],$q)!==false));
    ok(['results' => count($r) ? $r : array_slice($cat,0,4)]);
}

// ══════════════════════════════════════════════════════════
// PING — Health check
// ══════════════════════════════════════════════════════════
if ($route === 'ping') {
    ok(['status' => 'online', 'time' => date('c')]);
}

fail('Ruta no encontrada', 404);
