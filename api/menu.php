<?php
header('Content-Type: application/json');
require 'db.php';

$sql = "SELECT m.item_id, m.item_name, m.description, m.base_price, m.image_url,
               m.is_popular, m.has_size, m.has_sugar, m.has_serve, m.fixed_temp,
               c.category_name
        FROM tbl_menu_items m
        JOIN tbl_categories c ON c.category_id = m.category_id
        WHERE m.is_available = 1
        ORDER BY c.category_id, m.item_id";

$rows = $pdo->query($sql)->fetchAll();

$menu = array_map(fn($r) => [
    'id'          => (string) $r['item_id'],
    'name'        => $r['item_name'],
    'description' => $r['description'] ?? '',
    'price'       => (float) $r['base_price'],
    'image'       => $r['image_url'] ?? '',
    'category'    => $r['category_name'],
    'popular'     => (bool) $r['is_popular'],
    'hasSize'     => (bool) $r['has_size'],
    'hasSugar'    => (bool) $r['has_sugar'],
    'hasServe'    => (bool) $r['has_serve'],
    'fixedTemp'   => $r['fixed_temp'],
], $rows);

echo json_encode($menu);