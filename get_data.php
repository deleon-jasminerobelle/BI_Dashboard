<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch($action) {
    case 'product_sales':
        $query = "SELECT p.name as product, SUM(s.quantity) as total_quantity,
                 SUM(s.price * s.quantity) as revenue
                 FROM sales s
                 JOIN products p ON s.product_id = p.id
                 GROUP BY p.id, p.name
                 ORDER BY revenue DESC
                 LIMIT 5";

        $result = $conn->query($query);
        $data = array();

        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $data[] = array(
                    'product' => $row['product'],
                    'quantity' => (int)$row['total_quantity'],
                    'revenue' => (float)$row['revenue']
                );
            }
        }
        echo json_encode($data);
        break;

    case 'monthly_sales':
        $query = "SELECT DATE_FORMAT(date, '%Y-%m') as month,
                 SUM(price * quantity) as total_sales
                 FROM sales
                 GROUP BY DATE_FORMAT(date, '%Y-%m')
                 ORDER BY month
                 LIMIT 12";

        $result = $conn->query($query);
        $data = array();

        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $data[] = array(
                    'month' => $row['month'],
                    'sales' => (float)$row['total_sales']
                );
            }
        }
        echo json_encode($data);
        break;

    case 'product_inventory':
        $query = "SELECT name as product, inventory, price
                 FROM products
                 WHERE inventory > 0
                 ORDER BY inventory DESC
                 LIMIT 10";

        $result = $conn->query($query);
        $data = array();

        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $data[] = array(
                    'product' => $row['product'],
                    'inventory' => (int)$row['inventory'],
                    'price' => (float)$row['price']
                );
            }
        }
        echo json_encode($data);
        break;

    case 'revenue_target':
        $query = "SELECT DATE_FORMAT(s.date, '%Y-%m') AS month,
                        SUM(s.price * s.quantity) AS actual_sales
                FROM sales s
                GROUP BY month
                ORDER BY month ASC
                LIMIT 12";

        $result = $conn->query($query);

        if (!$result) {
            echo json_encode(['error' => $conn->error]);
            break;
        }

        $data = [];
        $previousTarget = null;

        while ($row = $result->fetch_assoc()) {
            $month = $row['month'];
            $actualSales = (float)$row['actual_sales'];
            $targetSales = null;

            if (count($data) === 0) {
                $targetSales = null;
            } else {
                $last = end($data);

                if ($last['target_sales'] === null) {
                    $targetSales = $last['actual_sales'] * 1.5;
                    $previousTarget = $targetSales;
                } else if ($last['actual_sales'] >= $last['target_sales']) {
                    $previousTarget = $last['actual_sales'] * 1.5;
                }

                $targetSales = $previousTarget;
            }

            $data[] = [
                'month' => $month,
                'actual_sales' => $actualSales,
                'target_sales' => $targetSales
            ];
        }

        echo json_encode($data);
        break;

    case 'top_customers':
        $query = "SELECT u.first_name, u.last_name, SUM(s.price * s.quantity) as total_spent
              FROM users u
              JOIN sales s ON u.id = s.user_id
              GROUP BY u.id, u.first_name, u.last_name
              ORDER BY total_spent DESC
              LIMIT 10";

        $result = $conn->query($query);

        if (!$result) {
            echo json_encode(['error' => $conn->error]);
            break;
        }

        $data = array();

        while($row = $result->fetch_assoc()) {
            $fullName = $row['first_name'] . ' ' . $row['last_name'];
            $data[] = array(
                'full_name' => $fullName,
                'total_spent' => (float)$row['total_spent']
            );
        }
        echo json_encode($data);
        break;

    case 'location_sales':
        $query = "SELECT l.city AS location,
                     COUNT(s.id) AS order_count,
                     SUM(s.price * s.quantity) AS total_revenue
              FROM locations l
              LEFT JOIN sales s ON l.id = s.billing_address_id
              GROUP BY l.city
              HAVING total_revenue > 0
              ORDER BY total_revenue DESC";

        $result = $conn->query($query);

        if (!$result) {
            echo json_encode(['error' => $conn->error]);
            break;
        }

        $data = array();

        while($row = $result->fetch_assoc()) {
            $data[] = array(
                'location' => $row['location'],
                'order_count' => (int)$row['order_count'],
                'total_revenue' => (float)$row['total_revenue']
            );
        }
        echo json_encode($data);
        break;

    default:
        echo json_encode(array('error' => 'Invalid action'));
}

if (isset($conn)) {
    $conn->close();
}
?>