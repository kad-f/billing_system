<?php
if (isset($_POST["req"])) {
    require "lib.php";
    switch ($_POST["req"]) {
        // (A) SAVE BILL
        case "save":
            echo $_BILL->save(
                $_POST["to"],
                $_POST["ship"],
                $_POST["dop"],
                $_POST["due"],
                $_POST["notes"],
                json_decode($_POST["items"], 1),
                json_decode($_POST["totals"], 1),
                isset($_POST["id"]) ? $_POST["id"] : null
            ) ? "OK" : "ERROR";
            break;

        // (B) DELETE BILL
        case "del":
            echo $_BILL->del($_POST["id"]) ? "OK" : "ERROR";
            break;

        // (C) GET ALL BILLS
        case "getAll":
            echo json_encode($_BILL->getAll());
            break;

        // (D) GET BILL
        case "get":
            echo json_encode($_BILL->get($_POST["id"]));
            break;
    }
}