<?php
if ($_SERVER['HTTP_HOST'] === 'localhost' && $_SERVER['REQUEST_URI'] === '/Abdul_Billing_System/') {
    echo "Redirecting to index.html"; // Add this for debugging
    header('Location: index.html');
    exit();
}
class Bill
{
    // (A) CONSTRUCTOR - CONNECT TO DATABASE
    private $pdo = null;
    private $stmt = null;
    public $error = "";
    function __construct()
    {
        $this->pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
            DB_USER,
            DB_PASSWORD,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]
        );
    }

    // (B) DESTRUCTOR - CLOSE DATABASE CONNECTION
    function __destruct()
    {
        if ($this->stmt !== null) {
            $this->stmt = null;
        }
        if ($this->pdo !== null) {
            $this->pdo = null;
        }
    }

    // (C) HELPER - EXECUTE SQL QUERY
    function exec($sql, $data = null): void
    {
        $this->stmt = $this->pdo->prepare($sql);
        $this->stmt->execute($data);
    }

    // (D) SAVE BILL
    function save($to, $ship, $dop, $due, $notes, $items, $totals, $id = null)
    {
        // (D1) AUTO-COMMIT OFF
        $this->pdo->beginTransaction();

        // (D2) UPDATE ONLY - DELETE OLD ITEMS & TOTALS
        if ($id != null) {
            $this->exec("DELETE FROM `bill_items` WHERE `bill_id`=?", [$id]);
            $this->exec("DELETE FROM `bill_totals` WHERE `bill_id`=?", [$id]);
        }

        // (D3) MAIN ENTRY
        if ($id == null) {
            $sql = "INSERT INTO `bills` (`bill_to`, `bill_ship`, `bill_dop`, `bill_due`, `bill_notes`) VALUES (?,?,?,?,?)";
            $data = [$to, $ship, $dop, $due, $notes];
        } else {
            $sql = "UPDATE `bills` SET `bill_to`=?, `bill_ship`=?, `bill_dop`=?, `bill_due`=?, `bill_notes`=? WHERE `bill_id`=?";
            $data = [$to, $ship, $dop, $due, $notes, $id];
        }
        $this->exec($sql, $data);
        if ($id == null) {
            $id = $this->pdo->lastInsertId();
        }

        // (D4) ITEMS
        // (D4-1) ITEMS LIST
        $data = [];
        $j = 1;
        foreach ($items as $i) {
            array_push($data, $id, $j, $i["n"], isset($i["d"]) ? $i["d"] : null, $i["q"], $i["e"], $i["a"]);
            $j++;
        }

        // (D4-2) ITEMS SQL
        $sql = "INSERT INTO `bill_items` (`bill_id`, `item_id`, `item_name`, `item_desc`, `item_qty`, `item_each`, `item_amt`) VALUES ";
        $sql .= str_repeat("(?,?,?,?,?,?,?),", $j - 1);
        $sql = substr($sql, 0, -1) . ";";

        // (D4-3) INSERT ITEMS
        $this->exec($sql, $data);

        // (D5) TOTALS
        // (D5-1) TOTALS LIST
        $data = [];
        $j = 1;
        foreach ($totals as $t) {
            array_push($data, $id, $j, $t["n"], $t["a"]);
            $j++;
        }

        // (D5-2) ITEMS SQL
        $sql = "INSERT INTO `bill_totals` (`bill_id`, `total_id`, `total_name`, `total_amt`) VALUES ";
        $sql .= str_repeat("(?,?,?,?),", $j - 1);
        $sql = substr($sql, 0, -1) . ";";

        // (D5-3) INSERT TOTALS
        $this->exec($sql, $data);

        // (D6) DONE
        $this->pdo->commit();
        return true;
    }

    // (E) DELETE BILL
    function del($id)
    {
        $this->pdo->beginTransaction();
        $this->exec("DELETE FROM `bills` WHERE `bill_id`=?", [$id]);
        $this->exec("DELETE FROM `bill_items` WHERE `bill_id`=?", [$id]);
        $this->exec("DELETE FROM `bill_totals` WHERE `bill_id`=?", [$id]);
        $this->pdo->commit();
        return true;
    }

    // (F) GET ALL BILLS
    function getAll()
    {
        $this->exec("SELECT * FROM `bills`");
        return $this->stmt->fetchAll();
    }

    // (G) GET BILL
    function get($id)
    {
        // (G1) MAIN ENTRY
        $this->exec("SELECT * FROM `bills` WHERE `bill_id`=?", [$id]);
        $bill = $this->stmt->fetch();
        if ($bill === false) {
            return false;
        }

        // (G2) ITEMS
        $this->exec("SELECT `item_name`, `item_desc`, `item_qty`, `item_each`, `item_amt` FROM `bill_items` WHERE `bill_id`=?", [$id]);
        $bill["items"] = $this->stmt->fetchAll(PDO::FETCH_NUM);

        // (G3) TOTALS
        $this->exec("SELECT `total_name`, `total_amt` FROM `bill_totals` WHERE `bill_id`=?", [$id]);
        $bill["totals"] = $this->stmt->fetchAll(PDO::FETCH_NUM);

        // (G4) DONE
        return $bill;
    }
}

// (H) SETTINGS - CHANGE THESE TO YOUR OWN !
define("DB_HOST", "localhost");
define("DB_NAME", "abdul");
define("DB_CHARSET", "utf8mb4");
define("DB_USER", "root");
define("DB_PASSWORD", "");

// (I) DATABASE OBJECT
$_BILL = new Bill();