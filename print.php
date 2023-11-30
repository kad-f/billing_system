<?php
// (0) DO THESE FIRST!
// cd YOUR-HTTP-FOLDER/invlib
// composer require phpoffice/phpword
// composer require mpdf/mpdf
// edit invlib/invoicr.php > set your own company data (c1)
// download https://github.com/code-boxx/invoicr/

// (A) GET BILL
if (!isset($_GET["id"])) {
    exit("Invalid bill");
}
require "lib.php";
$bill = $_BILL->get($_GET["id"]);
if ($bill === false) {
    exit("Invalid bill");
}

// (B) GENERATE INVOICE
require "invlib/invoicr.php";
$invoicr->set("head", [
    ["Invoice #", $bill["bill_id"]],
    ["DOP", $bill["bill_dop"]],
    ["Due Date", $bill["bill_due"]]
]);
$invoicr->set("billto", preg_split("/\r\n|\r|\n/", $bill["bill_to"]));
$invoicr->set("shipto", preg_split("/\r\n|\r|\n/", $bill["bill_ship"]));
$invoicr->set("items", $bill["items"]);
$invoicr->set("totals", $bill["totals"]);
$invoicr->set("notes", preg_split("/\r\n|\r|\n/", $bill["bill_notes"]));

// (C) CHOOSE A TEMPLATE
$invoicr->template("apple");
// $invoicr->template("banana");
// $invoicr->template("blueberry");
// $invoicr->template("lime");
// $invoicr->template("simple");
// $invoicr->template("strawberry");

// (D) OUTPUT
// (D1) OUTPUT IN HTML
$invoicr->outputHTML(); // display in browser
// $invoicr->outputHTML(1); // display in browser
// $invoicr->outputHTML(2, "invoice.html"); // force download
// $invoicr->outputHTML(3, "invoice.html"); // save to file on server

// (D2) OUTPUT IN PDF
// $invoicr->outputPDF(); // display in browser
// $invoicr->outputPDF(1); // display in browser
// $invoicr->outputPDF(2, "invoice.pdf"); // force download
// $invoicr->outputPDF(3, "invoice.pdf"); // save to file on server

// (D3) OUTPUT IN DOCX
// $invoicr->outputDOCX(); // display in browser
// $invoicr->outputDOCX(1, "invoice.docx"); // force download
// $invoicr->outputDOCX(2, "invoice.docx"); // save to file on server