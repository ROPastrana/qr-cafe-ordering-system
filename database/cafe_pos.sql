-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: cafe_pos
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `cafe_pos`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `cafe_pos` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `cafe_pos`;

--
-- Table structure for table `tbl_cashiers`
--

DROP TABLE IF EXISTS `tbl_cashiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_cashiers` (
  `cashier_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `failed_attempts` int(11) NOT NULL DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  PRIMARY KEY (`cashier_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_cashiers`
--

LOCK TABLES `tbl_cashiers` WRITE;
/*!40000 ALTER TABLE `tbl_cashiers` DISABLE KEYS */;
INSERT INTO `tbl_cashiers` VALUES (1,'cashier01','$2y$10$vmTr.OOhb0rsVyibJmSrHOchdxpkxqXSLnQcHntnNi9qyYwyOu5WS','Cashier01',0,NULL);
/*!40000 ALTER TABLE `tbl_cashiers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_categories`
--

DROP TABLE IF EXISTS `tbl_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_categories` (
  `category_id` int(11) NOT NULL AUTO_INCREMENT,
  `category_name` varchar(50) NOT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `category_name` (`category_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_categories`
--

LOCK TABLES `tbl_categories` WRITE;
/*!40000 ALTER TABLE `tbl_categories` DISABLE KEYS */;
INSERT INTO `tbl_categories` VALUES (1,'Coffee'),(2,'Non-Coffee'),(3,'Pastries');
/*!40000 ALTER TABLE `tbl_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_customers`
--

DROP TABLE IF EXISTS `tbl_customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_customers` (
  `customer_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(100) NOT NULL,
  PRIMARY KEY (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_customers`
--

LOCK TABLES `tbl_customers` WRITE;
/*!40000 ALTER TABLE `tbl_customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_menu_items`
--

DROP TABLE IF EXISTS `tbl_menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_menu_items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `base_price` decimal(8,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `is_popular` tinyint(1) NOT NULL DEFAULT 0,
  `has_size` tinyint(1) NOT NULL DEFAULT 1,
  `has_sugar` tinyint(1) NOT NULL DEFAULT 1,
  `has_serve` tinyint(1) NOT NULL DEFAULT 1,
  `fixed_temp` enum('Hot','Cold') DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  KEY `fk_menu_category` (`category_id`),
  CONSTRAINT `fk_menu_category` FOREIGN KEY (`category_id`) REFERENCES `tbl_categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_menu_items`
--

LOCK TABLES `tbl_menu_items` WRITE;
/*!40000 ALTER TABLE `tbl_menu_items` DISABLE KEYS */;
INSERT INTO `tbl_menu_items` VALUES (1,1,'Salted Caramel Latte','Espresso with steamed oat milk and housemade sea-salted caramel syrup.',149.00,'https://images.unsplash.com/photo-1495774856032-8b90bbb32b32?w=400&h=400&fit=crop&auto=format',1,1,1,1,1,NULL),(2,1,'Spanish Latte','Double shot espresso, sweet condensed milk, and velvety textured fresh milk.',139.00,'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop&auto=format',1,1,1,1,1,NULL),(3,1,'Cold Brew Honey Oat','18-hour slow steeped specialty Arabica beans with cold oat milk and wild honey.',159.00,'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&h=400&fit=crop&auto=format',1,0,1,1,0,'Cold'),(4,1,'Classic Cappuccino','A shot of espresso balanced with equal parts steamed milk and a thick cap of warm foam, dusted with cocoa. Served hot only.',129.00,'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=400&h=400&fit=crop&auto=format',1,0,1,1,0,'Hot'),(5,1,'Velvet Flat White','Two ristretto shots topped with a silky layer of velvety microfoam for a smooth, full-bodied finish.',139.00,'https://images.unsplash.com/photo-1529892485617-25f63cd7b1e9?w=400&h=400&fit=crop&auto=format',1,0,1,1,1,NULL),(6,2,'Uji Matcha Latte','Ceremonial grade Japanese Uji green tea, stone-milled and whisked to a fine foam, then poured over creamy steamed oat milk.',159.00,'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=400&fit=crop&auto=format',1,1,1,1,1,NULL),(7,2,'Hibiscus Berry Iced Tea','Premium brewed hibiscus tea shaken hard with organic strawberry puree and fresh lemon, poured over crushed ice. Served iced only.',139.00,'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&h=400&fit=crop&auto=format',1,1,1,1,0,'Cold'),(8,2,'Belgian Hot Chocolate','Steamed fresh milk melted with real dark Belgian chocolate callets for a thick, glossy cup. Served hot only.',149.00,'https://images.unsplash.com/photo-1648192312898-838f9b322f47?w=400&h=400&fit=crop&auto=format',1,0,1,1,0,'Hot'),(9,2,'Hokkaido Taro Milk Tea','Creamy Hokkaido taro root blended with slow-brewed black tea and slow-cooked brown sugar for a mellow, nutty finish.',129.00,'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format',1,0,1,1,1,NULL),(10,2,'Peach Blossom Oolong','Loose-leaf high mountain oolong shaken with organic peach nectar and fresh mint leaves over ice. Served iced only.',119.00,'https://images.unsplash.com/photo-1601390395693-364c0e22031a?w=400&h=400&fit=crop&auto=format',1,0,1,1,0,'Cold'),(11,3,'Pistachio Rose Croissant','Flaky twice-baked butter croissant loaded with thick pistachio frangipane, crushed Sicilian pistachios and dried rose petals.',129.00,'https://images.unsplash.com/photo-1623334044303-241021148842?w=400&h=400&fit=crop&auto=format',1,1,0,0,0,NULL),(12,3,'Pain au Chocolat','Classic French pastry of butter-laminated dough folded around two batons of dark chocolate, baked to a deep golden crust.',99.00,'https://images.unsplash.com/photo-1773894470970-2908e13f3940?w=400&h=400&fit=crop&auto=format',1,1,0,0,0,NULL),(13,3,'Blueberry Cream Cheese Danish','Crisp puff pastry nest filled with sweet blueberry compote and whipped cream cheese, finished with a vanilla glaze.',119.00,'https://images.unsplash.com/photo-1702742322469-36315505728f?w=400&h=400&fit=crop&auto=format',1,0,0,0,0,NULL),(14,3,'Salted Caramel Pecan Bun','Soft cinnamon yeast roll topped with warm salted caramel and roasted pecans, baked fresh every morning.',109.00,'https://images.unsplash.com/photo-1583527976767-5399024eeb05?w=400&h=400&fit=crop&auto=format',1,0,0,0,0,NULL),(15,3,'Basque Burnt Cheesecake','Deeply caramelized crustless cheesecake with a custardy, semi-liquid centre. Best paired with a black coffee.',159.00,'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&h=400&fit=crop&auto=format',1,0,0,0,0,NULL);
/*!40000 ALTER TABLE `tbl_menu_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_order_items`
--

DROP TABLE IF EXISTS `tbl_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_order_items` (
  `order_item_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `temperature` varchar(20) DEFAULT NULL,
  `size` varchar(20) DEFAULT NULL,
  `sugar_level` varchar(20) DEFAULT NULL,
  `unit_price` decimal(8,2) NOT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `fk_oi_item` (`item_id`),
  KEY `idx_oi_order` (`order_id`),
  CONSTRAINT `fk_oi_item` FOREIGN KEY (`item_id`) REFERENCES `tbl_menu_items` (`item_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `tbl_orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_order_items`
--

LOCK TABLES `tbl_order_items` WRITE;
/*!40000 ALTER TABLE `tbl_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_orders`
--

DROP TABLE IF EXISTS `tbl_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_orders` (
  `order_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_code` varchar(20) NOT NULL,
  `track_token` varchar(32) DEFAULT NULL,
  `idempotency_key` varchar(36) DEFAULT NULL,
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
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `order_code` (`order_code`),
  UNIQUE KEY `track_token` (`track_token`),
  UNIQUE KEY `idempotency_key` (`idempotency_key`),
  KEY `fk_orders_customer` (`customer_id`),
  KEY `fk_orders_cashier` (`cashier_id`),
  KEY `idx_orders_status` (`order_status`),
  KEY `idx_orders_created` (`created_at`),
  CONSTRAINT `fk_orders_cashier` FOREIGN KEY (`cashier_id`) REFERENCES `tbl_cashiers` (`cashier_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `tbl_customers` (`customer_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_orders`
--

LOCK TABLES `tbl_orders` WRITE;
/*!40000 ALTER TABLE `tbl_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_rate_limit`
--

DROP TABLE IF EXISTS `tbl_rate_limit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_rate_limit` (
  `ip` varchar(45) NOT NULL,
  `bucket` varchar(30) NOT NULL,
  `hits` int(11) NOT NULL DEFAULT 0,
  `window_start` datetime NOT NULL,
  PRIMARY KEY (`ip`,`bucket`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_rate_limit`
--

LOCK TABLES `tbl_rate_limit` WRITE;
/*!40000 ALTER TABLE `tbl_rate_limit` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_rate_limit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_transactions`
--

DROP TABLE IF EXISTS `tbl_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_transactions` (
  `transaction_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `cashier_id` int(11) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `change_due` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` enum('cash','gcash') NOT NULL DEFAULT 'cash',
  `gcash_reference_no` varchar(20) DEFAULT NULL,
  `receipt_token` varchar(64) NOT NULL,
  `receipt_number` varchar(20) NOT NULL,
  `transaction_date` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`transaction_id`),
  UNIQUE KEY `order_id` (`order_id`),
  UNIQUE KEY `receipt_token` (`receipt_token`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  UNIQUE KEY `gcash_reference_no` (`gcash_reference_no`),
  KEY `fk_tx_cashier` (`cashier_id`),
  KEY `idx_tx_date` (`transaction_date`),
  CONSTRAINT `fk_tx_cashier` FOREIGN KEY (`cashier_id`) REFERENCES `tbl_cashiers` (`cashier_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_tx_order` FOREIGN KEY (`order_id`) REFERENCES `tbl_orders` (`order_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_transactions`
--

LOCK TABLES `tbl_transactions` WRITE;
/*!40000 ALTER TABLE `tbl_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'cafe_pos'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-04 12:50:16
