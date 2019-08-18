-- phpMyAdmin SQL Dump
-- version 4.8.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Nov 29, 2018 at 12:12 PM
-- Server version: 10.1.35-MariaDB
-- PHP Version: 7.2.9

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `airportel`
--

-- --------------------------------------------------------

--
-- Table structure for table `cars`
--

CREATE TABLE `cars` (
  `carID` int(11) NOT NULL,
  `typeID` int(5) NOT NULL,
  `capacity` int(2) NOT NULL DEFAULT '0',
  `detail` varchar(50) NOT NULL,
  `engine` varchar(50) NOT NULL,
  `license` varchar(50) NOT NULL,
  `image` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `cars`
--

INSERT INTO `cars` (`carID`, `typeID`, `capacity`, `detail`, `engine`, `license`, `image`, `createdAt`, `updatedAt`) VALUES
(7, 6, 14, 'Eco-1', '500cc', 'cap 14', 'cjm7qq89y0001afy19fbtpb6x.jpg', '2018-09-24 05:30:30', '2018-09-24 12:30:30'),
(8, 6, 18, 'Eco-2', '500cc', 'cap 18', 'cjm7qqgd20002afy1cvuvng4w.jpg', '2018-09-24 05:30:35', '2018-09-24 12:30:35'),
(9, 6, 18, 'Eco-3', '500cc', 'cap 18', 'cjm7qr3sv0003afy15lb72e1b.jpg', '2018-09-24 05:30:41', '2018-09-24 12:30:41'),
(10, 7, 45, 'Boxtruck-2', '500cc', 'cap 45', 'cjm7qsleh0004afy1l0vwdkkt.jpg', '2018-09-24 05:30:45', '2018-09-24 12:30:45'),
(11, 7, 30, 'Boxtruck-2-2', '500cc', 'cap 30', 'cjm7qsyht0005afy1v9dgi5ja.jpg', '2018-09-24 05:30:49', '2018-09-24 12:30:49');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `categorieID` int(11) NOT NULL,
  `name` varchar(25) NOT NULL,
  `description` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`categorieID`, `name`, `description`) VALUES
(1, 'location', 'location'),
(2, 'car', 'car'),
(3, 'luggage', 'luggage'),
(4, 'status', 'status');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `customerID` int(11) NOT NULL,
  `title` varchar(10) NOT NULL,
  `fullname` varchar(50) NOT NULL,
  `gender` set('male','female') NOT NULL,
  `age` int(3) NOT NULL,
  `identification` varchar(255) NOT NULL,
  `passportID` varchar(20) NOT NULL,
  `email` varchar(50) NOT NULL,
  `phone` varchar(10) NOT NULL,
  `social` varchar(50) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `drivers`
--

CREATE TABLE `drivers` (
  `driverID` int(11) NOT NULL,
  `carID` int(11) NOT NULL,
  `image` text NOT NULL,
  `fullname` varchar(50) NOT NULL,
  `gender` varchar(10) NOT NULL,
  `age` int(2) NOT NULL,
  `phone` varchar(12) NOT NULL,
  `email` varchar(50) NOT NULL,
  `successRate` int(1) NOT NULL DEFAULT '0',
  `delay` int(11) NOT NULL DEFAULT '0',
  `ontime` int(11) NOT NULL DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `drivers`
--

INSERT INTO `drivers` (`driverID`, `carID`, `image`, `fullname`, `gender`, `age`, `phone`, `email`, `successRate`, `delay`, `ontime`, `createdAt`, `updatedAt`) VALUES
(3, 10, 'cjm8oy1r200008hy10cv5x8ay.jpg', 'qweqwe', 'male', 12, '123456789012', 'qweqweqwe', 0, 0, 0, '2018-09-24 05:23:18', '2018-09-24 12:23:18'),
(4, 11, 'cjm8pt0ou000068y1qjpqvp15.jpg', 'qweqwe', 'male', 12, '123456789012', 'qweqweqwe', 0, 0, 0, '2018-09-24 05:23:20', '2018-09-24 12:23:20'),
(5, 0, 'cjmhzuwd90001pmy163jp9drx.jpg', 'qweqwe', 'male', 12, '123456789011', 'qweqweqwe', 0, 0, 0, '2018-09-25 17:28:02', '2018-09-25 17:28:02'),
(6, 0, 'cjmi00dqs00015ly1iclf8xz5.jpg', 'qweqwe', 'male', 12, '123456789011', 'qweqweqwe', 0, 0, 0, '2018-09-25 17:32:18', '2018-09-25 17:32:18'),
(7, 0, 'cjmi00u9h00025ly1h0c1qxfs.jpg', 'qweqweqwe', 'male', 12, '123456789011', 'qweqweqwe', 0, 0, 0, '2018-09-25 17:32:39', '2018-09-25 17:32:39'),
(8, 0, 'cjmi02pwy00035ly1isr541jn.jpg', 'qweqweqwe', 'male', 12, '123456789011', 'qweqweqwe', 0, 0, 0, '2018-09-25 17:34:07', '2018-09-25 17:34:07'),
(9, 0, 'cjmi035ae00045ly12m6xyn6n.jpg', 'qweqweqwe', 'male', 12, '123456789011', 'qweqweqwe', 0, 0, 0, '2018-09-25 17:34:27', '2018-09-25 17:34:27'),
(10, 0, 'cjmi03elw00055ly1fej3n8sc.jpg', 'qweqweqwe', 'male', 11, '123456789011', 'qweqweqwe', 0, 0, 0, '2018-09-25 17:34:39', '2018-09-25 17:34:39'),
(11, 12, 'cjoxs4vkx0000k9y1791akqaw.jpg', 'qweqweqwe', 'male', 1, '12345678901', 'qweqweqwe@gmail.com', 0, 0, 0, '2018-11-26 03:55:34', '2018-11-26 03:55:34'),
(12, 12, 'cjoxs72w30001k9y1a05hcy4j.jpg', 'qweqweqwe', 'male', 1, '12345678901', 'qweqweqwe@gmail.com', 0, 0, 0, '2018-11-26 03:57:17', '2018-11-26 03:57:17'),
(13, 12, 'cjoxs7fli0000o8y1jegx8xfr.jpg', 'qweqweqwe', 'male', 1, '12345678901', 'qweqweqwe@gmail.com', 0, 0, 0, '2018-11-26 03:57:33', '2018-11-26 03:57:33'),
(14, 12, 'cjoxs9db50000ovy13xrrm468.jpg', 'qweqweqwe', 'male', 1, '12345678901', 'qweqweqwe@gmail.com', 0, 0, 0, '2018-11-26 03:59:04', '2018-11-26 03:59:04'),
(15, 12, 'cjoxs9slz0000sey1624zlfne.jpg', 'qweqweqwe', 'male', 1, '12345678901', 'qweqweqwe@gmail.com', 0, 0, 0, '2018-11-26 03:59:23', '2018-11-26 03:59:23'),
(16, 12, 'cjoxsald40000ugy1pj6r57r6.jpg', 'qweqweqwe', 'male', 1, '12345678901', 'qweqweqwe@gmail.com', 0, 0, 0, '2018-11-26 04:00:01', '2018-11-26 04:00:01'),
(17, 12, 'cjoxsb99z0000wty1uagu9440.jpg', 'qweqweqwe', 'male', 1, '12345678901', 'qweqweqwe@gmail.com', 0, 0, 0, '2018-11-26 04:00:32', '2018-11-26 04:00:32'),
(18, 12, 'cjoxscvmj0000zky1kkg970e2.jpg', 'qweqweqwe', 'male', 1, '12345678901', 'qweqweqwe@gmail.com', 0, 0, 0, '2018-11-26 04:01:47', '2018-11-26 04:01:47'),
(19, 12, 'cjoxsdc2m00000jy1q62iopuy.jpg', 'qweqweqwe', 'male', 1, '12345678901', 'qweqweqwe@gmail.com', 0, 0, 0, '2018-11-26 04:02:09', '2018-11-26 04:02:09'),
(20, 12, 'cjoxsdnsj00001hy16oy7ynxx.jpg', 'qweqweqwe', 'male', 1, '12345678901', 'qweqweqwe@gmail.com', 0, 0, 0, '2018-11-26 04:02:24', '2018-11-26 04:02:24'),
(21, 12, 'cjoxse86w000031y15vx36t3x.jpg', 'qweqweqwe', 'male', 1, '12345678901', 'qweqweqwe@gmail.com', 0, 0, 0, '2018-11-26 04:02:50', '2018-11-26 04:02:50'),
(22, 12, 'cjoxsehda00003jy18rmxc5ve.jpg', 'qweqweqwe', 'male', 1, '12345678901', 'qweqweqwe@gmail.com', 0, 0, 0, '2018-11-26 04:03:02', '2018-11-26 04:03:02'),
(23, 12, 'cjoxsezwy00005dy17l1p6r5l.jpg', 'qweqweqwe', 'male', 1, '12345678901', 'qweqweqwe@gmail.com', 0, 0, 0, '2018-11-26 04:03:26', '2018-11-26 04:03:26'),
(24, 12, 'cjoxsft1k00008ey1f61ai3pw.jpg', 'qweqweqwe', 'male', 1, '12345678901', 'qweqweqwe@gmail.com', 0, 0, 0, '2018-11-26 04:04:04', '2018-11-26 04:04:04'),
(25, 12, 'cjoxsg9ov00009oy1py8lbgcf.jpg', 'qweqweqwe', 'male', 1, '12345678901', 'qweqweqwe@gmail.com', 0, 0, 0, '2018-11-26 04:04:26', '2018-11-26 04:04:26'),
(26, 12, 'cjoxtox6000019oy17718ev0t.jpg', 'qweqweqwe', 'male', 1, '12345678901', 'qweqweqwe@gmail.com', 0, 0, 0, '2018-11-26 04:39:09', '2018-11-26 04:39:09');

-- --------------------------------------------------------

--
-- Table structure for table `estimatetimes`
--

CREATE TABLE `estimatetimes` (
  `orderID` int(11) DEFAULT NULL,
  `estimate` datetime NOT NULL,
  `timeleft` datetime NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `estimatetimes`
--

INSERT INTO `estimatetimes` (`orderID`, `estimate`, `timeleft`, `createdAt`, `updatedAt`) VALUES
(8, '2018-11-24 02:00:00', '2018-11-24 05:25:00', '2018-11-29 03:44:56', '2018-11-29 03:44:56'),
(6, '2018-11-24 02:50:00', '2018-11-24 05:25:00', '2018-11-29 03:44:56', '2018-11-29 03:44:56'),
(12, '2018-11-24 04:30:00', '2018-11-24 05:25:00', '2018-11-29 03:44:56', '2018-11-29 03:44:56'),
(15, '2018-11-24 04:30:00', '2018-11-24 06:00:00', '2018-11-29 03:44:56', '2018-11-29 03:44:56'),
(23, '2018-11-24 05:00:00', '2018-11-24 06:00:00', '2018-11-29 03:44:56', '2018-11-29 03:44:56'),
(11, '2018-11-24 03:00:00', '2018-11-24 04:35:00', '2018-11-29 03:44:57', '2018-11-29 03:44:57'),
(10, '2018-11-24 03:35:00', '2018-11-24 05:20:00', '2018-11-29 03:44:57', '2018-11-29 03:44:57'),
(25, '2018-11-24 06:00:00', '2018-11-24 07:10:00', '2018-11-29 03:44:57', '2018-11-29 03:44:57'),
(14, '2018-11-24 06:00:00', '2018-11-24 07:10:00', '2018-11-29 03:44:57', '2018-11-29 03:44:57'),
(7, '2018-11-24 06:00:00', '2018-11-24 07:10:00', '2018-11-29 03:44:57', '2018-11-29 03:44:57'),
(9, '2018-11-24 06:00:00', '2018-11-24 07:10:00', '2018-11-29 03:44:57', '2018-11-29 03:44:57'),
(35, '2018-11-24 07:45:00', '2018-11-24 08:45:00', '2018-11-29 03:44:57', '2018-11-29 03:44:57'),
(28, '2018-11-24 07:45:00', '2018-11-24 08:45:00', '2018-11-29 03:44:57', '2018-11-29 03:44:57'),
(26, '2018-11-24 07:45:00', '2018-11-24 08:55:00', '2018-11-29 03:44:57', '2018-11-29 03:44:57'),
(17, '2018-11-24 05:00:00', '2018-11-24 08:35:00', '2018-11-29 03:44:57', '2018-11-29 03:44:57'),
(21, '2018-11-24 06:40:00', '2018-11-24 08:35:00', '2018-11-29 03:44:57', '2018-11-29 03:44:57'),
(19, '2018-11-24 05:35:00', '2018-11-24 08:35:00', '2018-11-29 03:44:57', '2018-11-29 03:44:57'),
(30, '2018-11-24 07:15:00', '2018-11-24 08:35:00', '2018-11-29 03:44:57', '2018-11-29 03:44:57'),
(33, '2018-11-24 08:00:00', '2018-11-24 08:35:00', '2018-11-29 03:44:57', '2018-11-29 03:44:57'),
(5, '2018-11-24 02:00:00', '2018-11-24 03:00:00', '2018-11-29 03:44:57', '2018-11-29 03:44:57'),
(36, '2018-11-24 09:00:00', '2018-11-24 10:10:00', '2018-11-29 03:44:58', '2018-11-29 03:44:58'),
(32, '2018-11-24 09:00:00', '2018-11-24 10:10:00', '2018-11-29 03:44:58', '2018-11-29 03:44:58'),
(24, '2018-11-24 09:00:00', '2018-11-24 10:10:00', '2018-11-29 03:44:58', '2018-11-29 03:44:58'),
(34, '2018-11-24 09:00:00', '2018-11-24 10:10:00', '2018-11-29 03:44:58', '2018-11-29 03:44:58'),
(13, '2018-11-24 09:00:00', '2018-11-24 10:10:00', '2018-11-29 03:44:58', '2018-11-29 03:44:58'),
(31, '2018-11-24 09:00:00', '2018-11-24 10:10:00', '2018-11-29 03:44:58', '2018-11-29 03:44:58'),
(16, '2018-11-24 09:00:00', '2018-11-24 10:10:00', '2018-11-29 03:44:58', '2018-11-29 03:44:58'),
(29, '2018-11-24 09:00:00', '2018-11-24 11:50:00', '2018-11-29 03:44:58', '2018-11-29 03:44:58'),
(20, '2018-11-24 09:00:00', '2018-11-24 09:55:00', '2018-11-29 03:44:58', '2018-11-29 03:44:58'),
(22, '2018-11-24 09:00:00', '2018-11-24 09:55:00', '2018-11-29 03:44:58', '2018-11-29 03:44:58'),
(18, '2018-11-24 09:00:00', '2018-11-24 09:55:00', '2018-11-29 03:44:58', '2018-11-29 03:44:58'),
(27, '2018-11-24 09:00:00', '2018-11-24 11:05:00', '2018-11-29 03:44:58', '2018-11-29 03:44:58');

-- --------------------------------------------------------

--
-- Table structure for table `locations`
--

CREATE TABLE `locations` (
  `locationID` varchar(100) NOT NULL,
  `name` text NOT NULL,
  `display` text NOT NULL,
  `lat` double NOT NULL,
  `lng` double NOT NULL,
  `phone` text,
  `email` varchar(50) NOT NULL,
  `typeID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `locations`
--

INSERT INTO `locations` (`locationID`, `name`, `display`, `lat`, `lng`, `phone`, `email`, `typeID`) VALUES
('ChIJ-a8Xb-ae4jAR37_D_gYBpdo', 'Mercure Bangkok Sukhumvit 11', '18 Sukhumvit 11 Alley, Khwaeng Khlong Toei Nuea, Khet Watthana, Krung Thep Maha Nakhon 10110, Thailand', 13.7432155, 100.5566996, '', '', 3),
('ChIJ14zN_vae4jARtKUK8uIyCtU', 'Maven Bangkok Hotel', '1990 New Petchaburi Rd, Khwaeng Bang Kapi, Khet Huai Khwang, Krung Thep Maha Nakhon 10310, Thailand', 13.7475179, 100.5715867, '', '', 3),
('ChIJ4VX0ws-e4jARBGaQ2IACrcQ', 'CTW', '999/9 Rama I Rd, Khwaeng Pathum Wan, Khet Pathum Wan, Krung Thep Maha Nakhon 10330, Thailand', 13.746596336364746, 100.5393615, '', '', 2),
('ChIJ5Srg2RSZ4jARICTop3S7fb0', 'Mad Monkey Hostel Bangkok @ Rambuttri Village Khaosan Area', '55 Phra Sumen Rd, Khwaeng Chana Songkhram, Khet Phra Nakhon, Krung Thep Maha Nakhon 10200, Thailand', 13.76322078704834, 100.4969936, '', '', 3),
('ChIJ69RRWk6f4jARy1AoWnYWRmE', 'Chatrium Residence Sathon Bangkok', '291 Naradhiwas Rajanakarindra 24 Alley, Khwaeng Chong Nonsi, Khet Yan Nawa, Krung Thep Maha Nakhon 10120, Thailand', 13.702489, 100.537566, '', '', 3),
('ChIJ6z-CdSGZ4jARojKsdCG8GME', 'Grand China Hotel Bangkok', '215 Yaowarat Rd, Khwaeng Samphanthawong, Khet Samphanthawong, Krung Thep Maha Nakhon 10100, Thailand', 13.742696762084961, 100.5069981, '', '', 3),
('ChIJ8YHrqi-f4jARBQM9sPS3PJ4', 'Bandara Suites Silom', 'Sala Daeng 1/1, Khwaeng Silom, Khet Bang Rak, Krung Thep Maha Nakhon 10500, Thailand', 13.725651741027832, 100.538158, '', '', 3),
('ChIJA-PGodye4jAR9QFikyxQo0s', 'Park Hyatt Bangkok', '88 Witthayu Rd, Khwaeng Lumphini, Khet Pathum Wan, Krung Thep Maha Nakhon 10330, Thailand', 13.743834495544434, 100.5470568, '', '', 3),
('ChIJA8tiM2GC4jAR11SlhoI5uxg', 'DMK', 'Sanambin, Don Mueang, Bangkok 10210, Thailand', 13.920150756835938, 100.6012948, '', '', 1),
('ChIJaUbo1maC4jARLzBcDSbVduw', 'Don Mueang Don Mueang', '333 Chert Wudthakas Road Don Mueang, Bangkok 10210, Thailand', 13.920578956604004, 100.6007649, '', '', 3),
('ChIJaWxpoOOe4jAR-FQulIK4zHA', 'T21', '88 Soi Sukhumvit 19, Khwaeng Khlong Toei Nuea, Khet Watthana, Krung Thep Maha Nakhon 10110, Thailand', 13.737547874450684, 100.5602251, '', '', 2),
('ChIJbfwrJy6f4jARf6wCzQybObU', 'Banyan Tree Bangkok', '21, 100 S Sathorn Rd, Thungmahamek Khet Sathon, Krung Thep Maha Nakhon 10120, Thailand', 13.723085403442383, 100.5398745, '', '', 3),
('ChIJbSPaTCWZ4jAR-gAPSgIxe28', 'LiT BANGKOK Residence', '36/1 Soi, ถนน พระรามที่ ๑ แขวง วังใหม่ เขต ปทุมวัน กรุงเทพมหานคร 10330, Thailand', 13.747995376586914, 100.5295198, '', '', 3),
('ChIJBSV8teOe4jARCc18BvYpuEs', '250 Sukhumvit Rd', '250 Sukhumvit Rd, Khwaeng Khlong Toei, Khet Khlong Toei, Krung Thep Maha Nakhon 10110, Thailand', 13.73755931854248, 100.5590345, '', '', 3),
('ChIJF41Gxqyf4jARbUM2nainGDo', 'Grande Centre Point Sukhumvit 55', '300 Soi Sukhumvit 55, Khlong Toei Nuea, Khet Watthana, Krung Thep Maha Nakhon 10110, Thailand', 13.7318441, 100.5821082, '', '', 3),
('ChIJgWl23I6Y4jARmHWMwXCD7SM', 'AVANI Riverside Bangkok Hotel', '257 Charoen Nakhon Rd, Khwaeng Samre, Khet Thon Buri, Krung Thep Maha Nakhon 10600, Thailand', 13.705103874206543, 100.4911426, '', '', 3),
('ChIJHW4iNW6b4jARqwxZ3qj4YVk', 'Condominium Rompo', '2, ถนน นนทบุรี 1 ตำบล สวนใหญ่ อำเภอเมืองนนทบุรี นนทบุรี 11000, Thailand', 13.8559064, 100.4846816, '', '', 3),
('ChIJHX2vQQGf4jARLykwXX0UfO4', 'IR-ON Hotel Sukhumvit 36', '10/10 ถนนสุขุมวิท 36, Khwaeng Khlong Tan, Khet Khlong Toei, Krung Thep Maha Nakhon 10110, Thailand', 13.722323417663574, 100.5766759, '', '', 3),
('ChIJI2uIfMie4jARpTy2mXSPiGA', 'Baiyoke Sky Hotel', '222 Ratchaprarop Rd, Khwaeng Thanon Phaya Thai, Khet Ratchathewi, Krung Thep Maha Nakhon 10400, Thailand', 13.754344940185547, 100.5402098, '', '', 3),
('ChIJI4ffGo-Y4jARFo-OT7ccz24', 'Anantara Riverside Bangkok Resort', '257, 1-3 Charoen Nakhon Rd, Khwaeng Samre, Khet Thon Buri, Krung Thep Maha Nakhon 10600, Thailand', 13.704654693603516, 100.4917476, '', '', 3),
('ChIJiRJSedye4jARL-Z-_LUY0Uc', 'Conrad Bangkok', '87 Witthayu Rd, Khwaeng Lumphini, Khet Pathum Wan, Krung Thep Maha Nakhon 10330, Thailand', 13.7392509, 100.5482462, '', '', 3),
('ChIJjVwIb-uf4jARmom5v8GkVWo', 'X2 Vibe Bangkok Sukhumvit Hotel โรงแรมครอสทูไวบ์กรุงเทพสุขุมวิท', '10 Sukhumvit 52 Alley, Khlong Toei, Phra Khanong, Krung Thep Maha Nakhon 10260, Thailand', 13.704112, 100.599184, '', '', 3),
('ChIJk_DPm_af4jAR2l4gK7uO_0I', 'สำนักงานเขตพระโขนง แขวง บางจาก', '306, สำนักงานเขตพระโขนง แขวง บางจาก กรุงเทพมหานคร Thailand', 13.69019889831543, 100.604752, '', '', 3),
('ChIJLWeTHUGC4jARfXi23915fb8', 'The Aim Sathorn Hotel', '106/1 Soi Sri-bamphen, Sathorn Road,Sathorn, Bangkok 10120 Khwaeng Thung Maha Mek, Khet Sathon, Krung Thep Maha Nakhon 10120, Thailand', 13.71971607208252, 100.5484374, '', '', 3),
('ChIJM2HqLK-f4jARj_xwApEvCok', 'Bangkok Marriott Hotel Sukhumvit', '2 Sukhumvit Soi 57 Klongtan Nua, Wattana Wattana Bangkok, 10, Krung Thep Maha Nakhon 10110, Thailand', 13.723371505737305, 100.5804653, '', '', 3),
('ChIJMditz76f4jARaJHwp_7Cqu4', '1595 Sukhumvit Rd', '1595 Sukhumvit Rd, Khwaeng Phra Khanong Nuea, Khet Watthana, Krung Thep Maha Nakhon 10110, Thailand', 13.714245796203613, 100.593478, '', '', 3),
('ChIJmU3dTsSY4jARebbGetKNR-k', 'Centre Point Hotel Silom', '1522/2 ซอย เกษร 1ถนน เจริญกรุง Khwaeng Bang Rak, Khet Bang Rak, Krung Thep Maha Nakhon 10500, Thailand', 13.72006607055664, 100.5150546, '', '', 3),
('ChIJn0og-uKe4jARNFXCc2GNrIc', 'CityPoint Hotel', '6, 22 Ratchadaphisek Rd, Khwaeng Khlong Toei, Khet Khlong Toei, Krung Thep Maha Nakhon 10110, Thailand', 13.7355094, 100.5606374, '', '', 3),
('ChIJnSyUGuae4jARoFED7h2nsPE', 'Citadines Sukhumvit 11 Bangkok', '22/22 Sukhumvit, 11 ถนน สุขุมวิท แขวง คลองตันเหนือ เขต วัฒนา กรุงเทพมหานคร 10110, Thailand', 13.743932723999023, 100.5567854, '', '', 3),
('ChIJoVRY5Mee4jARI_sqfC92WAM', 'Akara Hotel', '372 Sri Ayutthaya Road, Thanon Phyathai, Rajthevi, Bangkok 10400, Thailand', 13.756109237670898, 100.5413118, '', '', 3),
('ChIJp0T3su6f4jAR3nuFPvUb18g', 'At Mind Executive Suites', '8 ซอย สุขุมวิท 85 ถนน สุขุมวิท Khwaeng Bang Chak, Khet Phra Khanong, กรุงเทพมหานคร 10260, Thailand', 13.702594757080078, 100.60337, '', '', 3),
('ChIJP5kLjFuY4jARDOF7rWRyINs', 'Goodwill Machine Co,Ltd', '265-271 Ratchadaphisek Rd, Khwaeng Bukkhalo, Khet Thon Buri, Krung Thep Maha Nakhon 10600, Thailand', 13.709819793701172, 100.481485, '', '', 3),
('ChIJp6KTFsWY4jARoDNwXkzQ3sk', '1368 Charoen Krung Rd', '1368 Charoen Krung Rd, Khwaeng Bang Rak, Khet Bang Rak, Krung Thep Maha Nakhon 10500, Thailand', 13.722152709960938, 100.5165303, '', '', 3),
('ChIJPfA1ijuf4jARc6hk3hAIwT8', 'U Sathorn Bangkok', '105, 105/1 Ngam Duphli Alley, Khwaeng Thung Maha Mek, Khet Sathon, Krung Thep Maha Nakhon 10120, Thailand', 13.7187294, 100.5463383, '', '', 3),
('ChIJQSDFAeae4jARgTUYPFaAS1g', '30 9-10', '30, 9-10 Soi Sukhumvit 11, Khwaeng Khlong Toei Nuea, Khet Watthana, Krung Thep Maha Nakhon 10110, Thailand', 13.744949340820312, 100.5573356, '', '', 3),
('ChIJq_WaR8OY4jART-g721YfEwI', '333, โรงแรมเพนนินซูล', '333, โรงแรมเพนนินซูล่า, ถนนเจริญนคร, แขวงคลองต้นไทร เขตคลองสาน กรุงเทพมหานคร, 10600 10600, Thailand', 13.7231867, 100.5113864, '', '', 3),
('ChIJr2oXhLee4jARz2YLOB23ZJ8', '104/24 Rang Nam Alle', '104/24 Rang Nam Alley, Khwaeng Thanon Phaya Thai, Khet Ratchathewi, Krung Thep Maha Nakhon 10400, Thailand', 13.7595189, 100.5404612, '', '', 3),
('ChIJRR0i-GyZ4jAR31YtGTDpmFI', 'Casa Vimaya Riverside Hotel', '229 Phra Sumen Rd, Khwaeng Talat Yot, Khet Phra Nakhon, Krung Thep Maha Nakhon 10200, Thailand', 13.76159381866455, 100.4993551, '', '', 3),
('ChIJrSeQ-zqZ4jAR-2TYznFFeSE', 'Siri Sathorn Hotel', '27 ถนน สีลม Sala Daeng 1 Alley, Bang Rak, Khet Bang Rak, Krung Thep Maha Nakhon 10500, Thailand', 13.725507736206055, 100.538587, '', '', 3),
('ChIJs2dXVjKf4jARNPCa9q3jHos', 'Ibis Bangkok Sathorn', 'Soi Ngam Duphli Rama IV, Sathorn, แขวง ทุ่งมหาเมฆ Bangkok, 10120, Thailand', 13.721772193908691, 100.546654, '', '', 3),
('ChIJS4BPSrae4jARKoH64rwJAOg', 'Pullman Bangkok King Power', '8-2 Rang Nam Alley, Khwaeng Thanon Phaya Thai, Khet Ratchathewi, Krung Thep Maha Nakhon 10400, Thailand', 13.758930206298828, 100.537434, '', '', 3),
('ChIJT-EGk9-e4jAReCrRIVpZgN0', 'MBK', '444 Phayathai Rd, Khwaeng Wang Mai, Khet Pathum Wan, Krung Thep Maha Nakhon 10330, Thailand', 13.744468688964844, 100.5299086, '', '', 2),
('ChIJTydCFXdnHTERB3oVT1UZDRI', 'BKK', '999 หมู่ 1 Nong Prue, Amphoe Bang Phli, Chang Wat Samut Prakan 10540, Thailand', 13.689998626708984, 100.7501124, '', '', 1),
('ChIJvaruo7-Y4jARyI6OZRkhHqU', 'Chatrium Hotel Riverside Bangkok', '28 ถนน เจริญกรุง ซอย 70 Khwaeng Wat Phraya Krai, Khet Bang Kho Laem, Krung Thep Maha Nakhon 10120, Thailand', 13.711162567138672, 100.5091692, '', '', 3),
('ChIJvVSoBt2e4jARTkPqaFdcDcI', 'Novotel Bangkok Ploenchit Sukhumvit', '566 Phloen Chit Rd, Khwaeng Lumphini, Khet Pathum Wan, Krung Thep Maha Nakhon 10330, Thailand', 13.7427154, 100.5497883, '', '', 3),
('ChIJW3-qd-ae4jAR_lOtKTIfG7A', 'Dream Hotel', '空堤县 10 Soi Sukhumvit 15, Khwaeng Khlong Toei Nuea, Khet Watthana, Krung Thep Maha Nakhon 10110, Thailand', 13.740580558776855, 100.5587, '', '', 3),
('ChIJwb3uUy2f4jARiLau61iGk-8', 'Tower Club at lebua', '1055 Si Lom, Khwaeng Silom, Khet Bang Rak, Krung Thep Maha Nakhon 10500, Thailand', 13.721747398376465, 100.5169565, '', '', 3),
('ChIJx1aKBuSe4jARrTTSSO62I0I', 'The Manhattan Sukhumvit Bangkok', '13 Soi Sukhumvit 15, Phra Khanong, Khlong Toei, Krung Thep Maha Nakhon 10110, Thailand', 13.7397056, 100.5581832, '', '', 3),
('ChIJxbvmmtme4jARACnSVFICemI', '60 Lang Suan 1 Alley', '60 Lang Suan 1 Alley, Khwaeng Lumphini, Khet Pathum Wan, Krung Thep Maha Nakhon 10330, Thailand', 13.73897, 100.54335, '', '', 3),
('ChIJxRnO3Ouf4jARTrRrgxOhb-8', 'Ideo Mobi Sukhumvit', '2098 2099 Sukhumvit Rd, Khwaeng Bang Chak, Khet Phra Khanong, Krung Thep Maha Nakhon 10260, Thailand', 13.704193115234375, 100.6021793, '', '', 3),
('ChIJy8dg2AOf4jARVXw_XSLitmg', 'Compass SkyView Hotel Sukhumvit 24', 'Compass SkyView Hotel Sukhumvit 24, 12 ถนน Sukhumvit 24 Alley, Khwaeng Khlong Tan, Khet Khlong Toei, Krung Thep Maha Nakhon 10110, Thailand', 13.729329109191895, 100.5689321, '', '', 3),
('ChIJzyfR1RKZ4jARg2ywmW7sxWI', 'Buddy Lodge Hotel', '265 Khaosan Rd, Taladyod Pranakorn Krung Thep Maha Nakhon 10200, Thailand', 13.758557, 100.498536, '', '', 3);

-- --------------------------------------------------------

--
-- Table structure for table `logtimeline`
--

CREATE TABLE `logtimeline` (
  `id` int(10) NOT NULL,
  `planIDBefore` varchar(255) NOT NULL,
  `planIDAfter` varchar(255) NOT NULL,
  `planDate` int(10) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `orderdrivers`
--

CREATE TABLE `orderdrivers` (
  `orderDriverID` int(11) NOT NULL,
  `orderID` int(11) NOT NULL,
  `driverID` int(11) DEFAULT NULL,
  `carID` int(11) NOT NULL,
  `status` int(11) NOT NULL,
  `driverPickupDate` date NOT NULL,
  `driverDropDate` date NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `orderluggages`
--

CREATE TABLE `orderluggages` (
  `orderLuggageID` int(11) NOT NULL,
  `orderID` int(11) NOT NULL,
  `luggageID` int(11) NOT NULL,
  `amount` int(2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `orderluggages`
--

INSERT INTO `orderluggages` (`orderLuggageID`, `orderID`, `luggageID`, `amount`) VALUES
(1, 1, 8, 1),
(2, 2, 8, 1),
(3, 3, 8, 1),
(4, 4, 8, 1),
(5, 5, 8, 3),
(6, 6, 8, 1),
(7, 7, 8, 1),
(8, 8, 8, 3),
(9, 9, 8, 3),
(10, 10, 8, 2),
(11, 11, 8, 2),
(12, 12, 8, 4),
(13, 13, 8, 4),
(14, 14, 8, 3),
(15, 15, 8, 2),
(16, 16, 8, 2),
(17, 17, 8, 2),
(18, 18, 8, 2),
(19, 19, 8, 2),
(20, 20, 8, 2),
(21, 21, 8, 1),
(22, 22, 8, 1),
(23, 23, 8, 2),
(24, 24, 8, 2),
(25, 25, 8, 1),
(26, 26, 8, 2),
(27, 27, 8, 2),
(28, 28, 8, 4),
(29, 29, 8, 4),
(30, 30, 8, 2),
(31, 31, 8, 2),
(32, 32, 8, 3),
(33, 33, 8, 1),
(34, 34, 8, 1),
(35, 35, 8, 2),
(36, 36, 8, 2);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `orderID` int(11) NOT NULL,
  `orderCode` varchar(50) NOT NULL,
  `customerID` int(11) NOT NULL,
  `dropType` varchar(10) NOT NULL,
  `dropLoc` varchar(255) NOT NULL,
  `dropDate` datetime NOT NULL,
  `pickupType` varchar(10) NOT NULL,
  `pickupLoc` varchar(255) NOT NULL,
  `pickupDate` datetime NOT NULL,
  `orderType` int(11) NOT NULL,
  `airbnb` varchar(10) NOT NULL,
  `status` int(11) NOT NULL,
  `templateID` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`orderID`, `orderCode`, `customerID`, `dropType`, `dropLoc`, `dropDate`, `pickupType`, `pickupLoc`, `pickupDate`, `orderType`, `airbnb`, `status`, `templateID`, `createdAt`, `updatedAt`) VALUES
(1, 'LUG181023683', 1, 'mall', 'ChIJ4VX0ws-e4jARBGaQ2IACrcQ', '2018-10-23 19:40:00', 'airport', 'ChIJTydCFXdnHTERB3oVT1UZDRI', '2018-11-24 16:00:00', 1, '', 1, 21, '2018-11-29 03:44:37', '2018-11-29 03:44:37'),
(2, 'LUG181119491', 1, 'airport', 'ChIJTydCFXdnHTERB3oVT1UZDRI', '2018-11-19 13:30:00', 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-19 16:00:00', 1, '', 1, 12, '2018-11-29 03:44:37', '2018-11-29 03:44:37'),
(3, 'LUG181119491', 1, 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-19 16:00:00', 'hotel', 'ChIJiRJSedye4jARL-Z-_LUY0Uc', '2018-11-24 13:00:00', 1, '', 1, 13, '2018-11-29 03:44:37', '2018-11-29 03:44:37'),
(4, 'LUG1811912', 1, 'airport', 'ChIJTydCFXdnHTERB3oVT1UZDRI', '2018-11-23 19:30:00', 'hotel', 'ChIJHW4iNW6b4jARqwxZ3qj4YVk', '2018-11-24 12:00:00', 1, 'In', 1, 13, '2018-11-29 03:44:37', '2018-11-29 03:44:37'),
(5, 'LUG18101284', 1, 'airport', 'ChIJA8tiM2GC4jAR11SlhoI5uxg', '2018-11-24 07:30:00', 'hotelc', 'ChIJxbvmmtme4jARACnSVFICemI', '2018-11-24 17:00:00', 1, '', 1, 13, '2018-11-29 03:44:37', '2018-11-29 03:44:37'),
(6, 'LUG181111851', 1, 'hotel', 'ChIJjVwIb-uf4jARmom5v8GkVWo', '2018-11-24 09:00:00', 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 13:00:00', 1, '', 1, 32, '2018-11-29 03:44:37', '2018-11-29 03:44:37'),
(7, 'LUG181111851', 1, 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 13:00:00', 'airport', 'ChIJTydCFXdnHTERB3oVT1UZDRI', '2018-11-24 15:00:00', 1, '', 1, 31, '2018-11-29 03:44:37', '2018-11-29 03:44:37'),
(8, 'LUG181117539', 1, 'hotel', 'ChIJvVSoBt2e4jARTkPqaFdcDcI', '2018-11-24 09:00:00', 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 13:00:00', 1, '', 1, 32, '2018-11-29 03:44:37', '2018-11-29 03:44:37'),
(9, 'LUG181117539', 1, 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 13:00:00', 'airport', 'ChIJTydCFXdnHTERB3oVT1UZDRI', '2018-11-24 15:00:00', 1, '', 1, 31, '2018-11-29 03:44:37', '2018-11-29 03:44:37'),
(10, 'LUG181116698', 1, 'hotelc', 'ChIJr2oXhLee4jARz2YLOB23ZJ8', '2018-11-24 10:00:00', 'hotel', 'ChIJ-a8Xb-ae4jAR37_D_gYBpdo', '2018-11-24 18:00:00', 1, '', 1, 33, '2018-11-29 03:44:38', '2018-11-29 03:44:38'),
(11, 'LUG181122745', 1, 'hotel', 'ChIJx1aKBuSe4jARrTTSSO62I0I', '2018-11-24 10:00:00', 'hotel', 'ChIJ69RRWk6f4jARy1AoWnYWRmE', '2018-11-24 14:00:00', 1, '', 1, 33, '2018-11-29 03:44:38', '2018-11-29 03:44:38'),
(12, 'LUG181123272', 1, 'hotel', 'ChIJzyfR1RKZ4jARg2ywmW7sxWI', '2018-11-24 11:30:00', 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 1, '', 1, 32, '2018-11-29 03:44:38', '2018-11-29 03:44:38'),
(13, 'LUG181123272', 1, 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 'airport', 'ChIJTydCFXdnHTERB3oVT1UZDRI', '2018-11-24 20:00:00', 1, '', 1, 31, '2018-11-29 03:44:38', '2018-11-29 03:44:38'),
(14, 'LUG1811591', 1, 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 11:30:00', 'airport', 'ChIJTydCFXdnHTERB3oVT1UZDRI', '2018-11-24 23:30:00', 1, '', 1, 21, '2018-11-29 03:44:38', '2018-11-29 03:44:38'),
(15, 'LUG1811877', 1, 'hotel', 'ChIJgWl23I6Y4jARmHWMwXCD7SM', '2018-11-24 11:30:00', 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 1, '', 1, 32, '2018-11-29 03:44:38', '2018-11-29 03:44:38'),
(16, 'LUG1811877', 1, 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 'airport', 'ChIJTydCFXdnHTERB3oVT1UZDRI', '2018-11-24 23:00:00', 1, '', 1, 31, '2018-11-29 03:44:38', '2018-11-29 03:44:38'),
(17, 'LUG181123781', 1, 'hotel', 'ChIJ14zN_vae4jARtKUK8uIyCtU', '2018-11-24 12:00:00', 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 1, '', 1, 32, '2018-11-29 03:44:38', '2018-11-29 03:44:38'),
(18, 'LUG181123781', 1, 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 'airport', 'ChIJA8tiM2GC4jAR11SlhoI5uxg', '2018-11-24 22:00:00', 1, '', 1, 31, '2018-11-29 03:44:38', '2018-11-29 03:44:38'),
(19, 'LUG181121613', 1, 'hotel', 'ChIJn0og-uKe4jARNFXCc2GNrIc', '2018-11-24 12:00:00', 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 1, '', 1, 32, '2018-11-29 03:44:38', '2018-11-29 03:44:38'),
(20, 'LUG181121613', 1, 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 'airport', 'ChIJA8tiM2GC4jAR11SlhoI5uxg', '2018-11-24 18:00:00', 1, '', 1, 31, '2018-11-29 03:44:38', '2018-11-29 03:44:38'),
(21, 'LUG181123475', 1, 'hotelc', 'ChIJq_WaR8OY4jART-g721YfEwI', '2018-11-24 12:00:00', 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 1, '', 1, 32, '2018-11-29 03:44:38', '2018-11-29 03:44:38'),
(22, 'LUG181123475', 1, 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 'airport', 'ChIJA8tiM2GC4jAR11SlhoI5uxg', '2018-11-24 18:00:00', 1, '', 1, 31, '2018-11-29 03:44:38', '2018-11-29 03:44:38'),
(23, 'LUG1811440', 1, 'hotel', 'ChIJI4ffGo-Y4jARFo-OT7ccz24', '2018-11-24 12:00:00', 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 1, '', 1, 32, '2018-11-29 03:44:39', '2018-11-29 03:44:39'),
(24, 'LUG1811440', 1, 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 'airport', 'ChIJTydCFXdnHTERB3oVT1UZDRI', '2018-11-24 18:00:00', 1, '', 1, 31, '2018-11-29 03:44:39', '2018-11-29 03:44:39'),
(25, 'LUG181123329', 1, 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 12:00:00', 'airport', 'ChIJTydCFXdnHTERB3oVT1UZDRI', '2018-11-24 15:00:00', 1, '', 1, 21, '2018-11-29 03:44:39', '2018-11-29 03:44:39'),
(26, 'LUG181015927', 1, 'airport', 'ChIJTydCFXdnHTERB3oVT1UZDRI', '2018-11-24 12:00:00', 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 1, '', 1, 12, '2018-11-29 03:44:39', '2018-11-29 03:44:39'),
(27, 'LUG181015927', 1, 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 'hotel', 'ChIJF41Gxqyf4jARbUM2nainGDo', '2018-11-24 20:00:00', 1, '', 1, 13, '2018-11-29 03:44:39', '2018-11-29 03:44:39'),
(28, 'LUG181123374', 1, 'airport', 'ChIJA8tiM2GC4jAR11SlhoI5uxg', '2018-11-24 12:00:00', 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 1, '', 1, 12, '2018-11-29 03:44:39', '2018-11-29 03:44:39'),
(29, 'LUG181123374', 1, 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 'hotel', 'ChIJI4ffGo-Y4jARFo-OT7ccz24', '2018-11-24 18:00:00', 1, '', 1, 13, '2018-11-29 03:44:39', '2018-11-29 03:44:39'),
(30, 'LUG18111051', 1, 'hotel', 'ChIJPfA1ijuf4jARc6hk3hAIwT8', '2018-11-24 14:00:00', 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 1, '', 1, 32, '2018-11-29 03:44:39', '2018-11-29 03:44:39'),
(31, 'LUG18111051', 1, 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 'airport', 'ChIJTydCFXdnHTERB3oVT1UZDRI', '2018-11-24 20:00:00', 1, '', 1, 31, '2018-11-29 03:44:39', '2018-11-29 03:44:39'),
(32, 'LUG181119753', 1, 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 15:00:00', 'airport', 'ChIJTydCFXdnHTERB3oVT1UZDRI', '2018-11-24 18:00:00', 1, '', 1, 21, '2018-11-29 03:44:39', '2018-11-29 03:44:39'),
(33, 'LUG181123286', 1, 'mall', 'ChIJ4VX0ws-e4jARBGaQ2IACrcQ', '2018-11-24 15:00:00', 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 1, '', 1, 22, '2018-11-29 03:44:39', '2018-11-29 03:44:39'),
(34, 'LUG181123286', 1, 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 'airport', 'ChIJTydCFXdnHTERB3oVT1UZDRI', '2018-11-24 18:00:00', 1, '', 1, 21, '2018-11-29 03:44:39', '2018-11-29 03:44:39'),
(35, 'LUG181124565', 1, 'airport', 'ChIJA8tiM2GC4jAR11SlhoI5uxg', '2018-11-24 00:00:00', 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 1, '', 1, 12, '2018-11-29 03:44:39', '2018-11-29 03:44:39'),
(36, 'LUG181124565', 1, 'mall', 'ChIJaWxpoOOe4jAR-FQulIK4zHA', '2018-11-24 16:00:00', 'airport', 'ChIJTydCFXdnHTERB3oVT1UZDRI', '2018-11-24 18:00:00', 1, '', 1, 11, '2018-11-29 03:44:39', '2018-11-29 03:44:39');

-- --------------------------------------------------------

--
-- Table structure for table `planorders`
--

CREATE TABLE `planorders` (
  `orderID` int(11) DEFAULT NULL,
  `planID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `planorders`
--

INSERT INTO `planorders` (`orderID`, `planID`) VALUES
(11, 7),
(10, 7),
(5, 8),
(15, 9),
(23, 9),
(8, 10),
(6, 10),
(12, 10),
(25, 10),
(14, 10),
(26, 10),
(36, 10),
(32, 10),
(24, 10),
(34, 10),
(31, 10),
(16, 10),
(35, 12),
(28, 12),
(17, 11),
(19, 11),
(21, 11),
(30, 11),
(33, 11),
(27, 11);

-- --------------------------------------------------------

--
-- Table structure for table `plans`
--

CREATE TABLE `plans` (
  `planID` int(11) NOT NULL,
  `json` longtext NOT NULL,
  `driverID` int(11) NOT NULL,
  `planDate` date NOT NULL,
  `mergePlan` varchar(255) NOT NULL,
  `statusPlan` int(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `plans`
--

INSERT INTO `plans` (`planID`, `json`, `driverID`, `planDate`, `mergePlan`, `statusPlan`, `createdAt`, `updatedAt`) VALUES
(7, '{\"capacity\":4,\"totalOrders\":2,\"route\":{\"2018-11-24T10:00:00\":\"The Manhattan Sukhumvit Bangkok\",\"2018-11-24T10:35:00\":\"104/24 Rang Nam Alle\",\"2018-11-24T11:35:00\":\"Chatrium Residence Sathon Bangkok\",\"2018-11-24T12:20:00\":\"Mercure Bangkok Sukhumvit 11\"},\"driverStart\":\"2018-11-24T10:00:00\",\"driverEnd\":\"2018-11-24T11:35:00\",\"schedule\":1,\"orders\":[{\"orderID\":11,\"orderCode\":\"LUG181122745\",\"customerID\":1,\"dropLoc\":\"The Manhattan Sukhumvit Bangkok\",\"pickupLoc\":\"Chatrium Residence Sathon Bangkok\",\"dropDate\":\"2018-11-24T10:00:00\",\"pickupDate\":\"2018-11-24T14:00:00\",\"driverPickupDate\":\"2018-11-24T10:00:00\",\"driverDropDate\":\"2018-11-24T11:35:00\",\"critical\":\"2018-11-24T12:30:00\",\"airbnb\":\"\",\"luggage\":2,\"dropType\":\"hotel\",\"pickupType\":\"hotel\",\"dropLocTrue\":\"The Manhattan Sukhumvit Bangkok\",\"pickupLocTrue\":\"Chatrium Residence Sathon Bangkok\",\"criticalTrue\":\"2018-11-24T12:30:00.000Z\",\"dropDateTrue\":\"2018-11-24T10:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T14:00:00.000Z\"},{\"orderID\":10,\"orderCode\":\"LUG181116698\",\"customerID\":1,\"dropLoc\":\"104/24 Rang Nam Alle\",\"pickupLoc\":\"Mercure Bangkok Sukhumvit 11\",\"dropDate\":\"2018-11-24T10:00:00\",\"pickupDate\":\"2018-11-24T18:00:00\",\"driverPickupDate\":\"2018-11-24T10:35:00\",\"driverDropDate\":\"2018-11-24T12:20:00\",\"critical\":\"2018-11-24T16:30:00\",\"airbnb\":\"\",\"luggage\":2,\"dropType\":\"hotelc\",\"pickupType\":\"hotel\",\"dropLocTrue\":\"104/24 Rang Nam Alle\",\"pickupLocTrue\":\"Mercure Bangkok Sukhumvit 11\",\"criticalTrue\":\"2018-11-24T16:30:00.000Z\",\"dropDateTrue\":\"2018-11-24T10:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T18:00:00.000Z\"}]}', 0, '2018-11-24', '0', 1, '2018-11-29 10:09:23', '2018-11-29 10:09:23'),
(8, '{\"capacity\":3,\"totalOrders\":1,\"route\":{\"2018-11-24T09:00:00\":\"DMK\",\"2018-11-24T10:00:00\":\"60 Lang Suan 1 Alley\"},\"driverStart\":\"2018-11-24T09:00:00\",\"driverEnd\":\"2018-11-24T10:00:00\",\"schedule\":1,\"orders\":[{\"orderID\":5,\"orderCode\":\"LUG18101284\",\"customerID\":1,\"dropLoc\":\"DMK\",\"pickupLoc\":\"60 Lang Suan 1 Alley\",\"dropDate\":\"2018-11-24T07:30:00\",\"pickupDate\":\"2018-11-24T17:00:00\",\"driverPickupDate\":\"2018-11-24T09:00:00\",\"driverDropDate\":\"2018-11-24T10:00:00\",\"critical\":\"2018-11-24T15:15:00\",\"airbnb\":\"\",\"luggage\":3,\"dropType\":\"airport\",\"pickupType\":\"hotelc\",\"dropLocTrue\":\"DMK\",\"pickupLocTrue\":\"60 Lang Suan 1 Alley\",\"criticalTrue\":\"2018-11-24T15:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T07:30:00.000Z\",\"pickupDateTrue\":\"2018-11-24T17:00:00.000Z\"}]}', 0, '2018-11-24', '0', 1, '2018-11-29 10:09:23', '2018-11-29 10:09:23'),
(9, '{\"capacity\":4,\"totalOrders\":2,\"route\":{\"2018-11-24T11:30:00\":\"AVANI Riverside Bangkok Hotel\",\"2018-11-24T12:00:00\":\"Anantara Riverside Bangkok Resort\",\"2018-11-24T13:00:00\":\"T21\"},\"driverStart\":\"2018-11-24T11:30:00\",\"driverEnd\":\"2018-11-24T13:00:00\",\"schedule\":1,\"mainCar\":true,\"orders\":[{\"orderID\":15,\"orderCode\":\"LUG1811877\",\"customerID\":1,\"dropLoc\":\"AVANI Riverside Bangkok Hotel\",\"pickupLoc\":\"T21\",\"dropDate\":\"2018-11-24T11:30:00\",\"pickupDate\":\"2018-11-24T16:00:00\",\"driverPickupDate\":\"2018-11-24T11:30:00\",\"driverDropDate\":\"2018-11-24T13:00:00\",\"critical\":\"2018-11-24T14:30:00\",\"airbnb\":\"\",\"luggage\":2,\"dropType\":\"hotel\",\"pickupType\":\"mall\",\"dropLocTrue\":\"AVANI Riverside Bangkok Hotel\",\"pickupLocTrue\":\"BKK\",\"criticalTrue\":\"2018-11-24T21:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T11:30:00.000Z\",\"pickupDateTrue\":\"2018-11-24T23:00:00.000Z\",\"pickupLocConsolidate\":\"T21\"},{\"orderID\":23,\"orderCode\":\"LUG1811440\",\"customerID\":1,\"dropLoc\":\"Anantara Riverside Bangkok Resort\",\"pickupLoc\":\"T21\",\"dropDate\":\"2018-11-24T12:00:00\",\"pickupDate\":\"2018-11-24T16:00:00\",\"driverPickupDate\":\"2018-11-24T12:00:00\",\"driverDropDate\":\"2018-11-24T13:00:00\",\"critical\":\"2018-11-24T14:30:00\",\"airbnb\":\"\",\"luggage\":2,\"dropType\":\"hotel\",\"pickupType\":\"mall\",\"dropLocTrue\":\"Anantara Riverside Bangkok Resort\",\"pickupLocTrue\":\"BKK\",\"criticalTrue\":\"2018-11-24T16:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T12:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T18:00:00.000Z\",\"pickupLocConsolidate\":\"T21\"}]}', 0, '2018-11-24', '0', 1, '2018-11-29 10:09:23', '2018-11-29 10:09:23'),
(10, '{\"capacity\":26,\"totalOrders\":12,\"route\":{\"2018-11-24T09:00:00\":\"Novotel Bangkok Ploenchit Sukhumvit\",\"2018-11-24T09:50:00\":\"X2 Vibe Bangkok Sukhumvit Hotel โรงแรมครอสทูไวบ์กรุงเทพสุขุมวิท\",\"2018-11-24T11:30:00\":\"Buddy Lodge Hotel\",\"2018-11-24T12:25:00\":\"T21\"},\"driverStart\":{\"orderID\":8,\"orderCode\":\"LUG181117539\",\"customerID\":1,\"dropType\":\"hotel\",\"pickupType\":\"mall\",\"dropPlaceID\":\"ChIJvVSoBt2e4jARTkPqaFdcDcI\",\"pickupPlaceID\":\"ChIJaWxpoOOe4jAR-FQulIK4zHA\",\"dropLoc\":\"Novotel Bangkok Ploenchit Sukhumvit\",\"pickupLoc\":\"BKK\",\"dropDate\":\"2018-11-24T09:00:00\",\"pickupDate\":\"2018-11-24T13:00:00\",\"critical\":\"2018-11-24T11:30:00\",\"orderType\":1,\"airbnb\":\"\",\"status\":1,\"template\":{\"templateID\":32,\"traveling\":\"01:30:00\",\"templateDetail\":\"Hotel to Mall\"},\"drivers\":[],\"luggages\":[{\"orderLuggageID\":8,\"orderID\":8,\"luggageID\":8,\"amount\":3}],\"dropPlace\":{\"locationID\":\"ChIJvVSoBt2e4jARTkPqaFdcDcI\",\"name\":\"Novotel Bangkok Ploenchit Sukhumvit\",\"display\":\"566 Phloen Chit Rd, Khwaeng Lumphini, Khet Pathum Wan, Krung Thep Maha Nakhon 10330, Thailand\",\"lat\":13.7427154,\"lng\":100.5497883,\"phone\":\"\",\"email\":\"\",\"typeID\":3,\"type\":{\"typeID\":3,\"name\":\"hotel\",\"display\":\"Hotel\",\"description\":\"Customer Hotel\",\"value\":3,\"categoryID\":1}},\"pickupPlace\":{\"locationID\":\"ChIJTydCFXdnHTERB3oVT1UZDRI\",\"name\":\"BKK\",\"display\":\"999 หมู่ 1 Nong Prue, Amphoe Bang Phli, Chang Wat Samut Prakan 10540, Thailand\",\"lat\":13.689998626708984,\"lng\":100.7501124,\"phone\":\"\",\"email\":\"\",\"typeID\":1,\"type\":{\"typeID\":1,\"name\":\"airport\",\"display\":\"Airport\",\"description\":\"Airport in bangkok\",\"value\":1,\"categoryID\":1}},\"estimatetime\":{\"orderID\":8,\"estimate\":\"2018-11-24T02:00:00.000Z\",\"timeleft\":\"2018-11-24T05:25:00.000Z\"},\"luggage\":3,\"dropDateTrue\":\"2018-11-24T09:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T15:00:00.000Z\",\"criticalTrue\":\"2018-11-24T13:15:00.000Z\",\"dropLocTrue\":\"Novotel Bangkok Ploenchit Sukhumvit\",\"pickupLocTrue\":\"BKK\",\"driverPickupDate\":\"2018-11-24T09:00:00\",\"driverDropDate\":\"2018-11-24T14:10:00\"},\"driverEnd\":\"2018-11-24T12:25:00\",\"schedule\":1,\"mainCar\":true,\"orders\":[{\"orderID\":8,\"orderCode\":\"LUG181117539\",\"customerID\":1,\"dropLoc\":\"Novotel Bangkok Ploenchit Sukhumvit\",\"pickupLoc\":\"BKK\",\"dropDate\":\"2018-11-24T09:00:00\",\"pickupDate\":\"2018-11-24T13:00:00\",\"driverPickupDate\":\"2018-11-24T09:00:00\",\"driverDropDate\":\"2018-11-24T14:10:00\",\"critical\":\"2018-11-24T11:30:00\",\"airbnb\":\"\",\"luggage\":3,\"dropType\":\"hotel\",\"pickupType\":\"mall\",\"dropLocTrue\":\"Novotel Bangkok Ploenchit Sukhumvit\",\"pickupLocTrue\":\"BKK\",\"criticalTrue\":\"2018-11-24T13:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T09:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T15:00:00.000Z\"},{\"orderID\":6,\"orderCode\":\"LUG181111851\",\"customerID\":1,\"dropLoc\":\"X2 Vibe Bangkok Sukhumvit Hotel โรงแรมครอสทูไวบ์กรุงเทพสุขุมวิท\",\"pickupLoc\":\"BKK\",\"dropDate\":\"2018-11-24T09:00:00\",\"pickupDate\":\"2018-11-24T13:00:00\",\"driverPickupDate\":\"2018-11-24T09:50:00\",\"driverDropDate\":\"2018-11-24T14:10:00\",\"critical\":\"2018-11-24T11:30:00\",\"airbnb\":\"\",\"luggage\":1,\"dropType\":\"hotel\",\"pickupType\":\"mall\",\"dropLocTrue\":\"X2 Vibe Bangkok Sukhumvit Hotel โรงแรมครอสทูไวบ์กรุงเทพสุขุมวิท\",\"pickupLocTrue\":\"BKK\",\"criticalTrue\":\"2018-11-24T13:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T09:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T15:00:00.000Z\"},{\"orderID\":12,\"orderCode\":\"LUG181123272\",\"customerID\":1,\"dropLoc\":\"Buddy Lodge Hotel\",\"pickupLoc\":\"BKK\",\"dropDate\":\"2018-11-24T11:30:00\",\"pickupDate\":\"2018-11-24T16:00:00\",\"driverPickupDate\":\"2018-11-24T11:30:00\",\"driverDropDate\":\"2018-11-24T14:10:00\",\"critical\":\"2018-11-24T14:30:00\",\"airbnb\":\"\",\"luggage\":4,\"dropType\":\"hotel\",\"pickupType\":\"mall\",\"dropLocTrue\":\"Buddy Lodge Hotel\",\"pickupLocTrue\":\"BKK\",\"criticalTrue\":\"2018-11-24T18:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T11:30:00.000Z\",\"pickupDateTrue\":\"2018-11-24T20:00:00.000Z\"},{\"orderID\":25,\"orderCode\":\"LUG181123329\",\"customerID\":1,\"dropLoc\":\"T21\",\"pickupLoc\":\"BKK\",\"dropDate\":\"2018-11-24T12:00:00\",\"pickupDate\":\"2018-11-24T15:00:00\",\"driverPickupDate\":\"2018-11-24T13:00:00\",\"driverDropDate\":\"2018-11-24T14:10:00\",\"critical\":\"2018-11-24T13:15:00\",\"airbnb\":\"\",\"luggage\":1,\"dropType\":\"mall\",\"pickupType\":\"airport\",\"dropLocTrue\":\"T21\",\"pickupLocTrue\":\"BKK\",\"criticalTrue\":\"2018-11-24T13:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T12:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T15:00:00.000Z\"},{\"orderID\":14,\"orderCode\":\"LUG1811591\",\"customerID\":1,\"dropLoc\":\"T21\",\"pickupLoc\":\"BKK\",\"dropDate\":\"2018-11-24T11:30:00\",\"pickupDate\":\"2018-11-24T23:30:00\",\"driverPickupDate\":\"2018-11-24T13:00:00\",\"driverDropDate\":\"2018-11-24T14:10:00\",\"critical\":\"2018-11-24T21:45:00\",\"airbnb\":\"\",\"luggage\":3,\"dropType\":\"mall\",\"pickupType\":\"airport\",\"dropLocTrue\":\"T21\",\"pickupLocTrue\":\"BKK\",\"criticalTrue\":\"2018-11-24T21:45:00.000Z\",\"dropDateTrue\":\"2018-11-24T11:30:00.000Z\",\"pickupDateTrue\":\"2018-11-24T23:30:00.000Z\"},{\"orderID\":26,\"orderCode\":\"LUG181015927\",\"customerID\":1,\"dropLoc\":\"BKK\",\"pickupLoc\":\"T21\",\"dropDate\":\"2018-11-24T12:00:00\",\"pickupDate\":\"2018-11-24T16:00:00\",\"driverPickupDate\":\"2018-11-24T14:45:00\",\"driverDropDate\":\"2018-11-24T15:55:00\",\"critical\":\"2018-11-24T14:15:00\",\"airbnb\":\"\",\"luggage\":2,\"dropType\":\"airport\",\"pickupType\":\"mall\",\"dropLocTrue\":\"BKK\",\"pickupLocTrue\":\"Grande Centre Point Sukhumvit 55\",\"criticalTrue\":\"2018-11-24T18:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T12:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T20:00:00.000Z\",\"pickupLocConsolidate\":\"T21\"},{\"orderID\":36,\"orderCode\":\"LUG181124565\",\"customerID\":1,\"dropLoc\":\"T21\",\"pickupLoc\":\"BKK\",\"dropDate\":\"2018-11-24T16:00:00\",\"pickupDate\":\"2018-11-24T18:00:00\",\"driverPickupDate\":\"2018-11-24T16:00:00\",\"driverDropDate\":\"2018-11-24T17:10:00\",\"critical\":\"2018-11-24T15:45:00\",\"airbnb\":\"\",\"luggage\":2,\"dropType\":\"mall\",\"pickupType\":\"airport\",\"dropLocTrue\":\"DMK\",\"pickupLocTrue\":\"BKK\",\"criticalTrue\":\"2018-11-24T15:45:00.000Z\",\"dropDateTrue\":\"2018-11-24T00:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T18:00:00.000Z\",\"dropLocConsolidate\":\"T21\"},{\"orderID\":32,\"orderCode\":\"LUG181119753\",\"customerID\":1,\"dropLoc\":\"T21\",\"pickupLoc\":\"BKK\",\"dropDate\":\"2018-11-24T15:00:00\",\"pickupDate\":\"2018-11-24T18:00:00\",\"driverPickupDate\":\"2018-11-24T16:00:00\",\"driverDropDate\":\"2018-11-24T17:10:00\",\"critical\":\"2018-11-24T16:15:00\",\"airbnb\":\"\",\"luggage\":3,\"dropType\":\"mall\",\"pickupType\":\"airport\",\"dropLocTrue\":\"T21\",\"pickupLocTrue\":\"BKK\",\"criticalTrue\":\"2018-11-24T16:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T15:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T18:00:00.000Z\"},{\"orderID\":24,\"orderCode\":\"LUG1811440\",\"customerID\":1,\"dropLoc\":\"T21\",\"pickupLoc\":\"BKK\",\"dropDate\":\"2018-11-24T16:00:00\",\"pickupDate\":\"2018-11-24T18:00:00\",\"driverPickupDate\":\"2018-11-24T16:00:00\",\"driverDropDate\":\"2018-11-24T17:10:00\",\"critical\":\"2018-11-24T16:15:00\",\"airbnb\":\"\",\"luggage\":2,\"dropType\":\"mall\",\"pickupType\":\"airport\",\"dropLocTrue\":\"Anantara Riverside Bangkok Resort\",\"pickupLocTrue\":\"BKK\",\"criticalTrue\":\"2018-11-24T16:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T12:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T18:00:00.000Z\",\"dropLocConsolidate\":\"T21\"},{\"orderID\":34,\"orderCode\":\"LUG181123286\",\"customerID\":1,\"dropLoc\":\"T21\",\"pickupLoc\":\"BKK\",\"dropDate\":\"2018-11-24T16:00:00\",\"pickupDate\":\"2018-11-24T18:00:00\",\"driverPickupDate\":\"2018-11-24T16:00:00\",\"driverDropDate\":\"2018-11-24T17:10:00\",\"critical\":\"2018-11-24T16:15:00\",\"airbnb\":\"\",\"luggage\":1,\"dropType\":\"mall\",\"pickupType\":\"airport\",\"dropLocTrue\":\"CTW\",\"pickupLocTrue\":\"BKK\",\"criticalTrue\":\"2018-11-24T16:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T15:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T18:00:00.000Z\",\"dropLocConsolidate\":\"T21\"},{\"orderID\":31,\"orderCode\":\"LUG18111051\",\"customerID\":1,\"dropLoc\":\"T21\",\"pickupLoc\":\"BKK\",\"dropDate\":\"2018-11-24T16:00:00\",\"pickupDate\":\"2018-11-24T20:00:00\",\"driverPickupDate\":\"2018-11-24T16:00:00\",\"driverDropDate\":\"2018-11-24T17:10:00\",\"critical\":\"2018-11-24T18:15:00\",\"airbnb\":\"\",\"luggage\":2,\"dropType\":\"mall\",\"pickupType\":\"airport\",\"dropLocTrue\":\"U Sathorn Bangkok\",\"pickupLocTrue\":\"BKK\",\"criticalTrue\":\"2018-11-24T18:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T14:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T20:00:00.000Z\",\"dropLocConsolidate\":\"T21\"},{\"orderID\":16,\"orderCode\":\"LUG1811877\",\"customerID\":1,\"dropLoc\":\"T21\",\"pickupLoc\":\"BKK\",\"dropDate\":\"2018-11-24T16:00:00\",\"pickupDate\":\"2018-11-24T23:00:00\",\"driverPickupDate\":\"2018-11-24T16:00:00\",\"driverDropDate\":\"2018-11-24T17:10:00\",\"critical\":\"2018-11-24T21:15:00\",\"airbnb\":\"\",\"luggage\":2,\"dropType\":\"mall\",\"pickupType\":\"airport\",\"dropLocTrue\":\"AVANI Riverside Bangkok Hotel\",\"pickupLocTrue\":\"BKK\",\"criticalTrue\":\"2018-11-24T21:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T11:30:00.000Z\",\"pickupDateTrue\":\"2018-11-24T23:00:00.000Z\",\"dropLocConsolidate\":\"T21\"}]}', 0, '2018-11-24', '0', 1, '2018-11-29 10:09:23', '2018-11-29 10:09:23'),
(11, '{\"capacity\":10,\"totalOrders\":6,\"route\":{\"2018-11-24T12:00:00\":\"Maven Bangkok Hotel\",\"2018-11-24T12:35:00\":\"CityPoint Hotel\",\"2018-11-24T13:40:00\":\"333, โรงแรมเพนนินซูล\",\"2018-11-24T14:15:00\":\"U Sathorn Bangkok\",\"2018-11-24T15:00:00\":\"CTW\",\"2018-11-24T15:35:00\":\"T21\"},\"driverStart\":{\"orderID\":17,\"orderCode\":\"LUG181123781\",\"customerID\":1,\"dropType\":\"hotel\",\"pickupType\":\"mall\",\"dropPlaceID\":\"ChIJ14zN_vae4jARtKUK8uIyCtU\",\"pickupPlaceID\":\"ChIJaWxpoOOe4jAR-FQulIK4zHA\",\"dropLoc\":\"Maven Bangkok Hotel\",\"pickupLoc\":\"DMK\",\"dropDate\":\"2018-11-24T12:00:00\",\"pickupDate\":\"2018-11-24T16:00:00\",\"critical\":\"2018-11-24T14:30:00\",\"orderType\":1,\"airbnb\":\"\",\"status\":1,\"template\":{\"templateID\":32,\"traveling\":\"01:30:00\",\"templateDetail\":\"Hotel to Mall\"},\"drivers\":[],\"luggages\":[{\"orderLuggageID\":17,\"orderID\":17,\"luggageID\":8,\"amount\":2}],\"dropPlace\":{\"locationID\":\"ChIJ14zN_vae4jARtKUK8uIyCtU\",\"name\":\"Maven Bangkok Hotel\",\"display\":\"1990 New Petchaburi Rd, Khwaeng Bang Kapi, Khet Huai Khwang, Krung Thep Maha Nakhon 10310, Thailand\",\"lat\":13.7475179,\"lng\":100.5715867,\"phone\":\"\",\"email\":\"\",\"typeID\":3,\"type\":{\"typeID\":3,\"name\":\"hotel\",\"display\":\"Hotel\",\"description\":\"Customer Hotel\",\"value\":3,\"categoryID\":1}},\"pickupPlace\":{\"locationID\":\"ChIJA8tiM2GC4jAR11SlhoI5uxg\",\"name\":\"DMK\",\"display\":\"Sanambin, Don Mueang, Bangkok 10210, Thailand\",\"lat\":13.920150756835938,\"lng\":100.6012948,\"phone\":\"\",\"email\":\"\",\"typeID\":1,\"type\":{\"typeID\":1,\"name\":\"airport\",\"display\":\"Airport\",\"description\":\"Airport in bangkok\",\"value\":1,\"categoryID\":1}},\"estimatetime\":{\"orderID\":17,\"estimate\":\"2018-11-24T05:00:00.000Z\",\"timeleft\":\"2018-11-24T08:35:00.000Z\"},\"luggage\":2,\"dropDateTrue\":\"2018-11-24T12:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T22:00:00.000Z\",\"criticalTrue\":\"2018-11-24T20:15:00.000Z\",\"dropLocTrue\":\"Maven Bangkok Hotel\",\"pickupLocTrue\":\"DMK\",\"durationFromOrigin\":45,\"driverPickupDate\":\"2018-11-24T12:00:00\",\"driverDropDate\":\"2018-11-24T16:55:00\"},\"driverEnd\":\"2018-11-24T15:35:00\",\"schedule\":3,\"orders\":[{\"orderID\":17,\"orderCode\":\"LUG181123781\",\"customerID\":1,\"dropLoc\":\"Maven Bangkok Hotel\",\"pickupLoc\":\"DMK\",\"dropDate\":\"2018-11-24T12:00:00\",\"pickupDate\":\"2018-11-24T16:00:00\",\"driverPickupDate\":\"2018-11-24T12:00:00\",\"driverDropDate\":\"2018-11-24T16:55:00\",\"critical\":\"2018-11-24T14:30:00\",\"airbnb\":\"\",\"luggage\":2,\"dropType\":\"hotel\",\"pickupType\":\"mall\",\"dropLocTrue\":\"Maven Bangkok Hotel\",\"pickupLocTrue\":\"DMK\",\"criticalTrue\":\"2018-11-24T20:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T12:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T22:00:00.000Z\"},{\"orderID\":19,\"orderCode\":\"LUG181121613\",\"customerID\":1,\"dropLoc\":\"CityPoint Hotel\",\"pickupLoc\":\"DMK\",\"dropDate\":\"2018-11-24T12:00:00\",\"pickupDate\":\"2018-11-24T16:00:00\",\"driverPickupDate\":\"2018-11-24T12:35:00\",\"driverDropDate\":\"2018-11-24T16:55:00\",\"critical\":\"2018-11-24T14:30:00\",\"airbnb\":\"\",\"luggage\":2,\"dropType\":\"hotel\",\"pickupType\":\"mall\",\"dropLocTrue\":\"CityPoint Hotel\",\"pickupLocTrue\":\"DMK\",\"criticalTrue\":\"2018-11-24T16:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T12:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T18:00:00.000Z\"},{\"orderID\":21,\"orderCode\":\"LUG181123475\",\"customerID\":1,\"dropLoc\":\"333, โรงแรมเพนนินซูล\",\"pickupLoc\":\"DMK\",\"dropDate\":\"2018-11-24T12:00:00\",\"pickupDate\":\"2018-11-24T16:00:00\",\"driverPickupDate\":\"2018-11-24T13:40:00\",\"driverDropDate\":\"2018-11-24T16:55:00\",\"critical\":\"2018-11-24T14:30:00\",\"airbnb\":\"\",\"luggage\":1,\"dropType\":\"hotelc\",\"pickupType\":\"mall\",\"dropLocTrue\":\"333, โรงแรมเพนนินซูล\",\"pickupLocTrue\":\"DMK\",\"criticalTrue\":\"2018-11-24T16:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T12:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T18:00:00.000Z\"},{\"orderID\":30,\"orderCode\":\"LUG18111051\",\"customerID\":1,\"dropLoc\":\"U Sathorn Bangkok\",\"pickupLoc\":\"T21\",\"dropDate\":\"2018-11-24T14:00:00\",\"pickupDate\":\"2018-11-24T16:00:00\",\"driverPickupDate\":\"2018-11-24T14:15:00\",\"driverDropDate\":\"2018-11-24T15:35:00\",\"critical\":\"2018-11-24T14:30:00\",\"airbnb\":\"\",\"luggage\":2,\"dropType\":\"hotel\",\"pickupType\":\"mall\",\"dropLocTrue\":\"U Sathorn Bangkok\",\"pickupLocTrue\":\"BKK\",\"criticalTrue\":\"2018-11-24T18:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T14:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T20:00:00.000Z\",\"pickupLocConsolidate\":\"T21\"},{\"orderID\":33,\"orderCode\":\"LUG181123286\",\"customerID\":1,\"dropLoc\":\"CTW\",\"pickupLoc\":\"T21\",\"dropDate\":\"2018-11-24T15:00:00\",\"pickupDate\":\"2018-11-24T16:00:00\",\"driverPickupDate\":\"2018-11-24T15:00:00\",\"driverDropDate\":\"2018-11-24T15:35:00\",\"critical\":\"2018-11-24T14:30:00\",\"airbnb\":\"\",\"luggage\":1,\"dropType\":\"mall\",\"pickupType\":\"mall\",\"dropLocTrue\":\"CTW\",\"pickupLocTrue\":\"BKK\",\"criticalTrue\":\"2018-11-24T16:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T15:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T18:00:00.000Z\",\"pickupLocConsolidate\":\"T21\"},{\"orderID\":27,\"orderCode\":\"LUG181015927\",\"customerID\":1,\"dropLoc\":\"T21\",\"pickupLoc\":\"Grande Centre Point Sukhumvit 55\",\"dropDate\":\"2018-11-24T16:00:00\",\"pickupDate\":\"2018-11-24T20:00:00\",\"driverPickupDate\":\"2018-11-24T16:00:00\",\"driverDropDate\":\"2018-11-24T18:05:00\",\"critical\":\"2018-11-24T18:15:00\",\"airbnb\":\"\",\"luggage\":2,\"dropType\":\"mall\",\"pickupType\":\"hotel\",\"dropLocTrue\":\"BKK\",\"pickupLocTrue\":\"Grande Centre Point Sukhumvit 55\",\"criticalTrue\":\"2018-11-24T18:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T12:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T20:00:00.000Z\",\"dropLocConsolidate\":\"T21\"}]}', 0, '2018-11-24', '0', 1, '2018-11-29 10:09:23', '2018-11-29 10:09:23'),
(12, '{\"capacity\":6,\"totalOrders\":2,\"route\":{\"2018-11-24T14:45:00\":\"DMK\",\"2018-11-24T15:45:00\":\"T21\"},\"driverStart\":{\"orderID\":35,\"orderCode\":\"LUG181124565\",\"customerID\":1,\"dropType\":\"airport\",\"pickupType\":\"mall\",\"dropPlaceID\":\"ChIJA8tiM2GC4jAR11SlhoI5uxg\",\"pickupPlaceID\":\"ChIJaWxpoOOe4jAR-FQulIK4zHA\",\"dropLoc\":\"DMK\",\"pickupLoc\":\"T21\",\"dropDate\":\"2018-11-24T00:00:00\",\"pickupDate\":\"2018-11-24T16:00:00\",\"critical\":\"2018-11-24T14:15:00\",\"orderType\":1,\"airbnb\":\"\",\"status\":1,\"template\":{\"templateID\":12,\"traveling\":\"01:45:00\",\"templateDetail\":\"Airport to Mall\"},\"drivers\":[],\"luggages\":[{\"orderLuggageID\":35,\"orderID\":35,\"luggageID\":8,\"amount\":2}],\"dropPlace\":{\"locationID\":\"ChIJA8tiM2GC4jAR11SlhoI5uxg\",\"name\":\"DMK\",\"display\":\"Sanambin, Don Mueang, Bangkok 10210, Thailand\",\"lat\":13.920150756835938,\"lng\":100.6012948,\"phone\":\"\",\"email\":\"\",\"typeID\":1,\"type\":{\"typeID\":1,\"name\":\"airport\",\"display\":\"Airport\",\"description\":\"Airport in bangkok\",\"value\":1,\"categoryID\":1}},\"pickupPlace\":{\"locationID\":\"ChIJaWxpoOOe4jAR-FQulIK4zHA\",\"name\":\"T21\",\"display\":\"88 Soi Sukhumvit 19, Khwaeng Khlong Toei Nuea, Khet Watthana, Krung Thep Maha Nakhon 10110, Thailand\",\"lat\":13.737547874450684,\"lng\":100.5602251,\"phone\":\"\",\"email\":\"\",\"typeID\":2,\"type\":{\"typeID\":2,\"name\":\"mall\",\"display\":\"Shopping Mall\",\"description\":\"Shopping Mall in Bangkok\",\"value\":2,\"categoryID\":1}},\"estimatetime\":{\"orderID\":35,\"estimate\":\"2018-11-24T07:45:00.000Z\",\"timeleft\":\"2018-11-24T08:45:00.000Z\"},\"luggage\":2,\"dropDateTrue\":\"2018-11-24T00:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T18:00:00.000Z\",\"criticalTrue\":\"2018-11-24T15:45:00.000Z\",\"dropLocTrue\":\"DMK\",\"pickupLocTrue\":\"BKK\",\"pickupLocConsolidate\":\"T21\",\"durationFromOrigin\":40,\"driverPickupDate\":\"2018-11-24T14:45:00\",\"driverDropDate\":\"2018-11-24T15:45:00\"},\"driverEnd\":\"2018-11-24T15:45:00\",\"schedule\":3,\"orders\":[{\"orderID\":35,\"orderCode\":\"LUG181124565\",\"customerID\":1,\"dropLoc\":\"DMK\",\"pickupLoc\":\"T21\",\"dropDate\":\"2018-11-24T00:00:00\",\"pickupDate\":\"2018-11-24T16:00:00\",\"driverPickupDate\":\"2018-11-24T14:45:00\",\"driverDropDate\":\"2018-11-24T15:45:00\",\"critical\":\"2018-11-24T14:15:00\",\"airbnb\":\"\",\"luggage\":2,\"dropType\":\"airport\",\"pickupType\":\"mall\",\"dropLocTrue\":\"DMK\",\"pickupLocTrue\":\"BKK\",\"criticalTrue\":\"2018-11-24T15:45:00.000Z\",\"dropDateTrue\":\"2018-11-24T00:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T18:00:00.000Z\",\"pickupLocConsolidate\":\"T21\"},{\"orderID\":28,\"orderCode\":\"LUG181123374\",\"customerID\":1,\"dropLoc\":\"DMK\",\"pickupLoc\":\"Anantara Riverside Bangkok Resort\",\"dropDate\":\"2018-11-24T12:00:00\",\"pickupDate\":\"2018-11-24T16:00:00\",\"driverPickupDate\":\"2018-11-24T14:45:00\",\"driverDropDate\":\"2018-11-24T18:50:00\",\"critical\":\"2018-11-24T14:15:00\",\"airbnb\":\"\",\"luggage\":4,\"dropType\":\"airport\",\"pickupType\":\"mall\",\"dropLocTrue\":\"DMK\",\"pickupLocTrue\":\"Anantara Riverside Bangkok Resort\",\"criticalTrue\":\"2018-11-24T16:15:00.000Z\",\"dropDateTrue\":\"2018-11-24T12:00:00.000Z\",\"pickupDateTrue\":\"2018-11-24T18:00:00.000Z\"}]}', 0, '2018-11-24', '0', 1, '2018-11-29 10:09:23', '2018-11-29 10:09:23');

-- --------------------------------------------------------

--
-- Table structure for table `templates`
--

CREATE TABLE `templates` (
  `templateID` int(11) NOT NULL,
  `traveling` time NOT NULL,
  `templateDetail` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `templates`
--

INSERT INTO `templates` (`templateID`, `traveling`, `templateDetail`) VALUES
(11, '02:15:00', 'Airport to Airport'),
(12, '01:45:00', 'Airport to Mall'),
(13, '01:45:00', 'Airport to Hotel'),
(14, '01:45:00', 'Airport to Location'),
(15, '01:30:00', 'Tripizee (Point to NaNa)'),
(21, '01:45:00', 'Mall to Airport'),
(22, '01:30:00', 'Mall to Mall'),
(23, '01:30:00', 'Mall to Hotel'),
(24, '01:30:00', 'Mall to Location'),
(25, '01:30:00', 'Tripizee (Point to NaNa)'),
(31, '01:45:00', 'Hotel to Airport'),
(32, '01:30:00', 'Hotel to Mall'),
(33, '01:30:00', 'Hotel to Hotel'),
(34, '01:30:00', 'Hotel to Location'),
(35, '01:30:00', 'Tripizee (Point to NaNa)'),
(41, '01:45:00', 'Location to Airport'),
(42, '01:30:00', 'Location to Mall'),
(43, '01:30:00', 'Location to Hotel'),
(44, '01:30:00', 'Location to Location'),
(45, '01:30:00', 'Tripizee (Point to NaNa)');

-- --------------------------------------------------------

--
-- Table structure for table `types`
--

CREATE TABLE `types` (
  `typeID` int(11) NOT NULL,
  `name` varchar(25) NOT NULL,
  `display` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `value` int(11) NOT NULL,
  `categoryID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `types`
--

INSERT INTO `types` (`typeID`, `name`, `display`, `description`, `value`, `categoryID`) VALUES
(1, 'airport', 'Airport', 'Airport in bangkok', 1, 1),
(2, 'mall', 'Shopping Mall', 'Shopping Mall in Bangkok', 2, 1),
(3, 'hotel', 'Hotel', 'Customer Hotel', 3, 1),
(4, 'location', 'Location', 'Customer Direct Location', 4, 1),
(5, 'nana', 'NaNa', 'Location NaNa', 5, 1),
(6, 'ecoCar', 'eco car', 'eco car for < 8 bag', 8, 2),
(7, 'pickupTruck', 'pickup truck', 'pickup truck for all pickup position', 16, 2),
(8, 'boxTruck', 'box truck', 'box truck for loading', 24, 2),
(9, 'bag', 'bag', 'normal bag', 600, 3),
(10, 'golfBag', 'golf bag', 'golf bag', 800, 3),
(11, 'bicycle', 'bicycle', 'bicycle', 800, 3),
(12, 'nodriver', 'No Driver', 'No Driver', 1, 4),
(13, 'havedriver', 'Have Driver', 'Have Driver', 2, 4),
(14, 'gopickup', 'Go Pickup', 'Go Pickup', 3, 4),
(15, 'delivery', 'Delivery', 'Delivery', 4, 4),
(16, 'godrop', 'Go Drop', 'Go Drop', 5, 4),
(17, 'success', 'Success', 'Success', 6, 4);

-- --------------------------------------------------------

--
-- Table structure for table `velocities`
--

CREATE TABLE `velocities` (
  `velocityID` varchar(20) NOT NULL,
  `month` int(2) NOT NULL,
  `day` int(2) NOT NULL,
  `type` varchar(10) NOT NULL,
  `q1` int(3) NOT NULL,
  `q2` int(3) NOT NULL,
  `q3` int(3) NOT NULL,
  `q4` int(3) NOT NULL,
  `q5` int(3) NOT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `velocities`
--

INSERT INTO `velocities` (`velocityID`, `month`, `day`, `type`, `q1`, `q2`, `q3`, `q4`, `q5`, `updatedAt`) VALUES
('10_1_intown', 10, 1, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('10_1_long', 10, 1, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('10_2_intown', 10, 2, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('10_2_long', 10, 2, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('10_3_intown', 10, 3, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('10_3_long', 10, 3, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('10_4_intown', 10, 4, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('10_4_long', 10, 4, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('10_5_intown', 10, 5, 'intown', 12, 12, 12, 8, 8, '0000-00-00 00:00:00'),
('10_5_long', 10, 5, 'long', 34, 27, 27, 24, 24, '0000-00-00 00:00:00'),
('10_6_intown', 10, 6, 'intown', 18, 18, 15, 15, 15, '0000-00-00 00:00:00'),
('10_6_long', 10, 6, 'long', 38, 36, 36, 33, 33, '0000-00-00 00:00:00'),
('10_7_intown', 10, 7, 'intown', 18, 18, 18, 18, 18, '0000-00-00 00:00:00'),
('10_7_long', 10, 7, 'long', 40, 40, 36, 38, 38, '0000-00-00 00:00:00'),
('11_1_intown', 11, 1, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('11_1_long', 11, 1, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('11_2_intown', 11, 2, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('11_2_long', 11, 2, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('11_3_intown', 11, 3, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('11_3_long', 11, 3, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('11_4_intown', 11, 4, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('11_4_long', 11, 4, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('11_5_intown', 11, 5, 'intown', 12, 12, 12, 8, 8, '0000-00-00 00:00:00'),
('11_5_long', 11, 5, 'long', 34, 27, 27, 24, 24, '0000-00-00 00:00:00'),
('11_6_intown', 11, 6, 'intown', 18, 18, 15, 15, 15, '0000-00-00 00:00:00'),
('11_6_long', 11, 6, 'long', 38, 36, 36, 33, 33, '0000-00-00 00:00:00'),
('11_7_intown', 11, 7, 'intown', 18, 18, 18, 18, 18, '0000-00-00 00:00:00'),
('11_7_long', 11, 7, 'long', 40, 40, 36, 38, 38, '0000-00-00 00:00:00'),
('12_1_intown', 12, 1, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('12_1_long', 12, 1, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('12_2_intown', 12, 2, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('12_2_long', 12, 2, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('12_3_intown', 12, 3, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('12_3_long', 12, 3, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('12_4_intown', 12, 4, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('12_4_long', 12, 4, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('12_5_intown', 12, 5, 'intown', 12, 12, 12, 8, 8, '0000-00-00 00:00:00'),
('12_5_long', 12, 5, 'long', 34, 27, 27, 24, 24, '0000-00-00 00:00:00'),
('12_6_intown', 12, 6, 'intown', 18, 18, 15, 15, 15, '0000-00-00 00:00:00'),
('12_6_long', 12, 6, 'long', 38, 36, 36, 33, 33, '0000-00-00 00:00:00'),
('12_7_intown', 12, 7, 'intown', 18, 18, 18, 18, 18, '0000-00-00 00:00:00'),
('12_7_long', 12, 7, 'long', 40, 40, 36, 38, 38, '0000-00-00 00:00:00'),
('1_1_intown', 1, 1, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('1_1_long', 1, 1, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('1_2_intown', 1, 2, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('1_2_long', 1, 2, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('1_3_intown', 1, 3, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('1_3_long', 1, 3, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('1_4_intown', 1, 4, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('1_4_long', 1, 4, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('1_5_intown', 1, 5, 'intown', 12, 12, 12, 8, 8, '0000-00-00 00:00:00'),
('1_5_long', 1, 5, 'long', 34, 27, 27, 24, 24, '0000-00-00 00:00:00'),
('1_6_intown', 1, 6, 'intown', 18, 18, 15, 15, 15, '0000-00-00 00:00:00'),
('1_6_long', 1, 6, 'long', 38, 36, 36, 33, 33, '0000-00-00 00:00:00'),
('1_7_intown', 1, 7, 'intown', 18, 18, 18, 18, 18, '0000-00-00 00:00:00'),
('1_7_long', 1, 7, 'long', 40, 40, 36, 38, 38, '0000-00-00 00:00:00'),
('2_1_intown', 2, 1, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('2_1_long', 2, 1, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('2_2_intown', 2, 2, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('2_2_long', 2, 2, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('2_3_intown', 2, 3, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('2_3_long', 2, 3, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('2_4_intown', 2, 4, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('2_4_long', 2, 4, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('2_5_intown', 2, 5, 'intown', 12, 12, 12, 8, 8, '0000-00-00 00:00:00'),
('2_5_long', 2, 5, 'long', 34, 27, 27, 24, 24, '0000-00-00 00:00:00'),
('2_6_intown', 2, 6, 'intown', 18, 18, 15, 15, 15, '0000-00-00 00:00:00'),
('2_6_long', 2, 6, 'long', 38, 36, 36, 33, 33, '0000-00-00 00:00:00'),
('2_7_intown', 2, 7, 'intown', 18, 18, 18, 18, 18, '0000-00-00 00:00:00'),
('2_7_long', 2, 7, 'long', 40, 40, 36, 38, 38, '0000-00-00 00:00:00'),
('3_1_intown', 3, 1, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('3_1_long', 3, 1, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('3_2_intown', 3, 2, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('3_2_long', 3, 2, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('3_3_intown', 3, 3, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('3_3_long', 3, 3, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('3_4_intown', 3, 4, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('3_4_long', 3, 4, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('3_5_intown', 3, 5, 'intown', 12, 12, 12, 8, 8, '0000-00-00 00:00:00'),
('3_5_long', 3, 5, 'long', 34, 27, 27, 24, 24, '0000-00-00 00:00:00'),
('3_6_intown', 3, 6, 'intown', 18, 18, 15, 15, 15, '0000-00-00 00:00:00'),
('3_6_long', 3, 6, 'long', 38, 36, 36, 33, 33, '0000-00-00 00:00:00'),
('3_7_intown', 3, 7, 'intown', 18, 18, 18, 18, 18, '0000-00-00 00:00:00'),
('3_7_long', 3, 7, 'long', 40, 40, 36, 38, 38, '0000-00-00 00:00:00'),
('4_1_intown', 4, 1, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('4_1_long', 4, 1, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('4_2_intown', 4, 2, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('4_2_long', 4, 2, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('4_3_intown', 4, 3, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('4_3_long', 4, 3, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('4_4_intown', 4, 4, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('4_4_long', 4, 4, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('4_5_intown', 4, 5, 'intown', 12, 12, 12, 8, 8, '0000-00-00 00:00:00'),
('4_5_long', 4, 5, 'long', 34, 27, 27, 24, 24, '0000-00-00 00:00:00'),
('4_6_intown', 4, 6, 'intown', 18, 18, 15, 15, 15, '0000-00-00 00:00:00'),
('4_6_long', 4, 6, 'long', 38, 36, 36, 33, 33, '0000-00-00 00:00:00'),
('4_7_intown', 4, 7, 'intown', 18, 18, 18, 18, 18, '0000-00-00 00:00:00'),
('4_7_long', 4, 7, 'long', 40, 40, 36, 38, 38, '0000-00-00 00:00:00'),
('5_1_intown', 5, 1, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('5_1_long', 5, 1, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('5_2_intown', 5, 2, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('5_2_long', 5, 2, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('5_3_intown', 5, 3, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('5_3_long', 5, 3, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('5_4_intown', 5, 4, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('5_4_long', 5, 4, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('5_5_intown', 5, 5, 'intown', 12, 12, 12, 8, 8, '0000-00-00 00:00:00'),
('5_5_long', 5, 5, 'long', 34, 27, 27, 24, 24, '0000-00-00 00:00:00'),
('5_6_intown', 5, 6, 'intown', 18, 18, 15, 15, 15, '0000-00-00 00:00:00'),
('5_6_long', 5, 6, 'long', 38, 36, 36, 33, 33, '0000-00-00 00:00:00'),
('5_7_intown', 5, 7, 'intown', 18, 18, 18, 18, 18, '0000-00-00 00:00:00'),
('5_7_long', 5, 7, 'long', 40, 40, 36, 38, 38, '0000-00-00 00:00:00'),
('6_1_intown', 6, 1, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('6_1_long', 6, 1, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('6_2_intown', 6, 2, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('6_2_long', 6, 2, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('6_3_intown', 6, 3, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('6_3_long', 6, 3, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('6_4_intown', 6, 4, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('6_4_long', 6, 4, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('6_5_intown', 6, 5, 'intown', 12, 12, 12, 8, 8, '0000-00-00 00:00:00'),
('6_5_long', 6, 5, 'long', 34, 27, 27, 24, 24, '0000-00-00 00:00:00'),
('6_6_intown', 6, 6, 'intown', 18, 18, 15, 15, 15, '0000-00-00 00:00:00'),
('6_6_long', 6, 6, 'long', 38, 36, 36, 33, 33, '0000-00-00 00:00:00'),
('6_7_intown', 6, 7, 'intown', 18, 18, 18, 18, 18, '0000-00-00 00:00:00'),
('6_7_long', 6, 7, 'long', 40, 40, 36, 38, 38, '0000-00-00 00:00:00'),
('7_1_intown', 7, 1, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('7_1_long', 7, 1, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('7_2_intown', 7, 2, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('7_2_long', 7, 2, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('7_3_intown', 7, 3, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('7_3_long', 7, 3, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('7_4_intown', 7, 4, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('7_4_long', 7, 4, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('7_5_intown', 7, 5, 'intown', 12, 12, 12, 8, 8, '0000-00-00 00:00:00'),
('7_5_long', 7, 5, 'long', 34, 27, 27, 24, 24, '0000-00-00 00:00:00'),
('7_6_intown', 7, 6, 'intown', 18, 18, 15, 15, 15, '0000-00-00 00:00:00'),
('7_6_long', 7, 6, 'long', 38, 36, 36, 33, 33, '0000-00-00 00:00:00'),
('7_7_intown', 7, 7, 'intown', 18, 18, 18, 18, 18, '0000-00-00 00:00:00'),
('7_7_long', 7, 7, 'long', 40, 40, 36, 38, 38, '0000-00-00 00:00:00'),
('8_1_intown', 8, 1, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('8_1_long', 8, 1, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('8_2_intown', 8, 2, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('8_2_long', 8, 2, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('8_3_intown', 8, 3, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('8_3_long', 8, 3, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('8_4_intown', 8, 4, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('8_4_long', 8, 4, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('8_5_intown', 8, 5, 'intown', 12, 12, 12, 8, 8, '0000-00-00 00:00:00'),
('8_5_long', 8, 5, 'long', 34, 27, 27, 24, 24, '0000-00-00 00:00:00'),
('8_6_intown', 8, 6, 'intown', 18, 18, 15, 15, 15, '0000-00-00 00:00:00'),
('8_6_long', 8, 6, 'long', 38, 36, 36, 33, 33, '0000-00-00 00:00:00'),
('8_7_intown', 8, 7, 'intown', 18, 18, 18, 18, 18, '0000-00-00 00:00:00'),
('8_7_long', 8, 7, 'long', 40, 40, 36, 38, 38, '0000-00-00 00:00:00'),
('9_1_intown', 9, 1, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('9_1_long', 9, 1, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('9_2_intown', 9, 2, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('9_2_long', 9, 2, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('9_3_intown', 9, 3, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('9_3_long', 9, 3, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('9_4_intown', 9, 4, 'intown', 15, 15, 15, 12, 12, '0000-00-00 00:00:00'),
('9_4_long', 9, 4, 'long', 37, 37, 32, 28, 28, '0000-00-00 00:00:00'),
('9_5_intown', 9, 5, 'intown', 12, 12, 12, 8, 8, '0000-00-00 00:00:00'),
('9_5_long', 9, 5, 'long', 34, 27, 27, 24, 24, '0000-00-00 00:00:00'),
('9_6_intown', 9, 6, 'intown', 18, 18, 15, 15, 15, '0000-00-00 00:00:00'),
('9_6_long', 9, 6, 'long', 38, 36, 36, 33, 33, '0000-00-00 00:00:00'),
('9_7_intown', 9, 7, 'intown', 18, 18, 18, 18, 18, '0000-00-00 00:00:00'),
('9_7_long', 9, 7, 'long', 40, 40, 36, 38, 38, '0000-00-00 00:00:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cars`
--
ALTER TABLE `cars`
  ADD PRIMARY KEY (`carID`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`categorieID`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`customerID`);

--
-- Indexes for table `drivers`
--
ALTER TABLE `drivers`
  ADD PRIMARY KEY (`driverID`);

--
-- Indexes for table `estimatetimes`
--
ALTER TABLE `estimatetimes`
  ADD UNIQUE KEY `orderID` (`orderID`);

--
-- Indexes for table `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`locationID`);

--
-- Indexes for table `logtimeline`
--
ALTER TABLE `logtimeline`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orderdrivers`
--
ALTER TABLE `orderdrivers`
  ADD PRIMARY KEY (`orderDriverID`),
  ADD KEY `orderID` (`orderID`),
  ADD KEY `orderID_2` (`orderID`);

--
-- Indexes for table `orderluggages`
--
ALTER TABLE `orderluggages`
  ADD PRIMARY KEY (`orderLuggageID`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`orderID`);

--
-- Indexes for table `planorders`
--
ALTER TABLE `planorders`
  ADD UNIQUE KEY `orderID` (`orderID`);

--
-- Indexes for table `plans`
--
ALTER TABLE `plans`
  ADD PRIMARY KEY (`planID`);

--
-- Indexes for table `templates`
--
ALTER TABLE `templates`
  ADD PRIMARY KEY (`templateID`);

--
-- Indexes for table `types`
--
ALTER TABLE `types`
  ADD PRIMARY KEY (`typeID`);

--
-- Indexes for table `velocities`
--
ALTER TABLE `velocities`
  ADD PRIMARY KEY (`velocityID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cars`
--
ALTER TABLE `cars`
  MODIFY `carID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `categorieID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `customerID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `drivers`
--
ALTER TABLE `drivers`
  MODIFY `driverID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `logtimeline`
--
ALTER TABLE `logtimeline`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orderdrivers`
--
ALTER TABLE `orderdrivers`
  MODIFY `orderDriverID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orderluggages`
--
ALTER TABLE `orderluggages`
  MODIFY `orderLuggageID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `orderID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `plans`
--
ALTER TABLE `plans`
  MODIFY `planID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `types`
--
ALTER TABLE `types`
  MODIFY `typeID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
