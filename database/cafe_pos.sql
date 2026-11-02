-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 02, 2026 at 07:41 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cafe_pos`
--
CREATE DATABASE IF NOT EXISTS `cafe_pos` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cafe_pos`;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_cashiers`
--

DROP TABLE IF EXISTS `tbl_cashiers`;
CREATE TABLE `tbl_cashiers` (
  `cashier_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_cashiers`
--

INSERT INTO `tbl_cashiers` (`cashier_id`, `username`, `password_hash`, `full_name`) VALUES
(1, 'cashier01', '$2y$10$vmTr.OOhb0rsVyibJmSrHOchdxpkxqXSLnQcHntnNi9qyYwyOu5WS', 'Cashier01');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_categories`
--

DROP TABLE IF EXISTS `tbl_categories`;
CREATE TABLE `tbl_categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_categories`
--

INSERT INTO `tbl_categories` (`category_id`, `category_name`) VALUES
(1, 'Coffee'),
(2, 'Non-Coffee'),
(3, 'Pastries');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_customers`
--

DROP TABLE IF EXISTS `tbl_customers`;
CREATE TABLE `tbl_customers` (
  `customer_id` int(11) NOT NULL,
  `customer_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_menu_items`
--

DROP TABLE IF EXISTS `tbl_menu_items`;
CREATE TABLE `tbl_menu_items` (
  `item_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `base_price` decimal(8,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `is_popular` tinyint(1) NOT NULL DEFAULT 0,
  `has_size` tinyint(1) NOT NULL DEFAULT 1,
  `has_sugar` tinyint(1) NOT NULL DEFAULT 1,
  `has_serve` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_menu_items`
--

INSERT INTO `tbl_menu_items` (`item_id`, `category_id`, `item_name`, `description`, `base_price`, `image_url`, `is_available`, `is_popular`, `has_size`, `has_sugar`, `has_serve`) VALUES
(1, 1, 'Salted Caramel Latte', 'Espresso with steamed oat milk and housemade sea-salted caramel syrup.', 149.00, 'https://images.unsplash.com/photo-1495774856032-8b90bbb32b32?w=400&h=400&fit=crop&auto=format', 1, 1, 1, 1, 1),
(2, 1, 'Spanish Latte', 'Double shot espresso, sweet condensed milk, and velvety textured fresh milk.', 145.00, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop&auto=format', 1, 1, 1, 1, 1),
(3, 1, 'Cold Brew Honey Oat', '18-hour slow steeped specialty Arabica beans with cold oat milk and wild honey.', 159.00, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&h=400&fit=crop&auto=format', 1, 0, 1, 1, 0),
(4, 1, 'Classic Cappuccino', 'A shot of espresso balanced with equal parts steamed milk and a thick cap of warm foam, dusted with cocoa. Served hot only.', 129.00, 'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=400&h=400&fit=crop&auto=format', 1, 0, 1, 1, 0),
(5, 1, 'Velvet Flat White', 'Two ristretto shots topped with a silky layer of velvety microfoam for a smooth, full-bodied finish.', 139.00, 'https://images.unsplash.com/photo-1529892485617-25f63cd7b1e9?w=400&h=400&fit=crop&auto=format', 1, 0, 1, 1, 1),
(6, 2, 'Uji Matcha Latte', 'Ceremonial grade Japanese Uji green tea, stone-milled and whisked to a fine foam, then poured over creamy steamed oat milk.', 159.00, 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=400&fit=crop&auto=format', 1, 1, 1, 1, 1),
(7, 2, 'Hibiscus Berry Iced Tea', 'Premium brewed hibiscus tea shaken hard with organic strawberry puree and fresh lemon, poured over crushed ice. Served iced only.', 139.00, 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&h=400&fit=crop&auto=format', 1, 1, 1, 1, 0),
(8, 2, 'Belgian Hot Chocolate', 'Steamed fresh milk melted with real dark Belgian chocolate callets for a thick, glossy cup. Served hot only.', 149.00, 'https://images.unsplash.com/photo-1648192312898-838f9b322f47?w=400&h=400&fit=crop&auto=format', 1, 0, 1, 1, 0),
(9, 2, 'Hokkaido Taro Milk Tea', 'Creamy Hokkaido taro root blended with slow-brewed black tea and slow-cooked brown sugar for a mellow, nutty finish.', 129.00, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format', 1, 0, 1, 1, 1),
(10, 2, 'Peach Blossom Oolong', 'Loose-leaf high mountain oolong shaken with organic peach nectar and fresh mint leaves over ice. Served iced only.', 119.00, 'https://images.unsplash.com/photo-1601390395693-364c0e22031a?w=400&h=400&fit=crop&auto=format', 1, 0, 1, 1, 0),
(11, 3, 'Pistachio Rose Croissant', 'Flaky twice-baked butter croissant loaded with thick pistachio frangipane, crushed Sicilian pistachios and dried rose petals.', 129.00, 'https://images.unsplash.com/photo-1623334044303-241021148842?w=400&h=400&fit=crop&auto=format', 1, 1, 0, 0, 0),
(12, 3, 'Pain au Chocolat', 'Classic French pastry of butter-laminated dough folded around two batons of dark chocolate, baked to a deep golden crust.', 99.00, 'https://images.unsplash.com/photo-1773894470970-2908e13f3940?w=400&h=400&fit=crop&auto=format', 1, 1, 0, 0, 0),
(13, 3, 'Blueberry Cream Cheese Danish', 'Crisp puff pastry nest filled with sweet blueberry compote and whipped cream cheese, finished with a vanilla glaze.', 119.00, 'https://images.unsplash.com/photo-1702742322469-36315505728f?w=400&h=400&fit=crop&auto=format', 1, 0, 0, 0, 0),
(14, 3, 'Salted Caramel Pecan Bun', 'Soft cinnamon yeast roll topped with warm salted caramel and roasted pecans, baked fresh every morning.', 109.00, 'https://images.unsplash.com/photo-1583527976767-5399024eeb05?w=400&h=400&fit=crop&auto=format', 1, 0, 0, 0, 0),
(15, 3, 'Basque Burnt Cheesecake', 'Deeply caramelized crustless cheesecake with a custardy, semi-liquid centre. Best paired with a black coffee.', 159.00, 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&h=400&fit=crop&auto=format', 1, 0, 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_orders`
--

DROP TABLE IF EXISTS `tbl_orders`;
CREATE TABLE `tbl_orders` (
  `order_id` int(11) NOT NULL,
  `order_code` varchar(20) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `cashier_id` int(11) DEFAULT NULL,
  `order_type` enum('self_order','walk_in') NOT NULL,
  `service_type` enum('dine_in','take_out') NOT NULL DEFAULT 'dine_in',
  `order_status` enum('pending','preparing','ready','completed','declined') NOT NULL DEFAULT 'pending',
  `decline_reason` varchar(255) DEFAULT NULL,
  `decline_note` varchar(255) DEFAULT NULL,
  `discount_type` enum('none','senior','pwd','student') NOT NULL DEFAULT 'none',
  `discount_amount` decimal(8,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_order_items`
--

DROP TABLE IF EXISTS `tbl_order_items`;
CREATE TABLE `tbl_order_items` (
  `order_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `temperature` varchar(20) DEFAULT NULL,
  `size` varchar(20) DEFAULT NULL,
  `sugar_level` varchar(20) DEFAULT NULL,
  `unit_price` decimal(8,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_transactions`
--

DROP TABLE IF EXISTS `tbl_transactions`;
CREATE TABLE `tbl_transactions` (
  `transaction_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `cashier_id` int(11) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `change_due` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` enum('cash','gcash') NOT NULL DEFAULT 'cash',
  `gcash_reference_no` varchar(20) DEFAULT NULL,
  `receipt_token` varchar(64) NOT NULL,
  `receipt_number` varchar(20) NOT NULL,
  `transaction_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_cashiers`
--
ALTER TABLE `tbl_cashiers`
  ADD PRIMARY KEY (`cashier_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `tbl_categories`
--
ALTER TABLE `tbl_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `category_name` (`category_name`);

--
-- Indexes for table `tbl_customers`
--
ALTER TABLE `tbl_customers`
  ADD PRIMARY KEY (`customer_id`);

--
-- Indexes for table `tbl_menu_items`
--
ALTER TABLE `tbl_menu_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `fk_menu_category` (`category_id`);

--
-- Indexes for table `tbl_orders`
--
ALTER TABLE `tbl_orders`
  ADD PRIMARY KEY (`order_id`),
  ADD UNIQUE KEY `order_code` (`order_code`),
  ADD KEY `fk_orders_customer` (`customer_id`),
  ADD KEY `fk_orders_cashier` (`cashier_id`),
  ADD KEY `idx_orders_status` (`order_status`),
  ADD KEY `idx_orders_created` (`created_at`);

--
-- Indexes for table `tbl_order_items`
--
ALTER TABLE `tbl_order_items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `fk_oi_item` (`item_id`),
  ADD KEY `idx_oi_order` (`order_id`);

--
-- Indexes for table `tbl_transactions`
--
ALTER TABLE `tbl_transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD UNIQUE KEY `order_id` (`order_id`),
  ADD UNIQUE KEY `receipt_token` (`receipt_token`),
  ADD UNIQUE KEY `receipt_number` (`receipt_number`),
  ADD UNIQUE KEY `gcash_reference_no` (`gcash_reference_no`),
  ADD KEY `fk_tx_cashier` (`cashier_id`),
  ADD KEY `idx_tx_date` (`transaction_date`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_cashiers`
--
ALTER TABLE `tbl_cashiers`
  MODIFY `cashier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_categories`
--
ALTER TABLE `tbl_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_customers`
--
ALTER TABLE `tbl_customers`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_menu_items`
--
ALTER TABLE `tbl_menu_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `tbl_orders`
--
ALTER TABLE `tbl_orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_order_items`
--
ALTER TABLE `tbl_order_items`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_transactions`
--
ALTER TABLE `tbl_transactions`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_menu_items`
--
ALTER TABLE `tbl_menu_items`
  ADD CONSTRAINT `fk_menu_category` FOREIGN KEY (`category_id`) REFERENCES `tbl_categories` (`category_id`);

--
-- Constraints for table `tbl_orders`
--
ALTER TABLE `tbl_orders`
  ADD CONSTRAINT `fk_orders_cashier` FOREIGN KEY (`cashier_id`) REFERENCES `tbl_cashiers` (`cashier_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `tbl_customers` (`customer_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `tbl_order_items`
--
ALTER TABLE `tbl_order_items`
  ADD CONSTRAINT `fk_oi_item` FOREIGN KEY (`item_id`) REFERENCES `tbl_menu_items` (`item_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `tbl_orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_transactions`
--
ALTER TABLE `tbl_transactions`
  ADD CONSTRAINT `fk_tx_cashier` FOREIGN KEY (`cashier_id`) REFERENCES `tbl_cashiers` (`cashier_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tx_order` FOREIGN KEY (`order_id`) REFERENCES `tbl_orders` (`order_id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
