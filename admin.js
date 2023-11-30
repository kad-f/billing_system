var bill = {
    // (A) PROPERTIES
    // (A1) HTML BILLS LIST
    blWrap : null, // bills list wrapper
    blList : null, // bills list
  
    // (A2) HTML BILLING FORM
    bfWrap : null,   // form wrapper
    bfTitle : null,  // form title
    bfForm : null,   // billing information form
    bfiForm : null,  // add item form
    bftForm : null,  // add total form
    bfiList : null,  // items list
    bftList : null,  // totals list
    bftSub : null,   // sub total
    bftGrand : null, // grand total
  
    // (B) HELPER - AJAX FETCH
    ajax : (data, onload) => {
      // (B1) FORM DATA
      let form = new FormData();
      for (let [k,v] of Object.entries(data)) { form.append(k, v); }
  
      // (B2) AJAX FETCH
      fetch("ajax.php", { method:"post", body:form })
      .then(res => res.text())
      .then(txt => onload(txt))
      .catch(err => console.error(err));
    },
  
    // (C) INIT
    init : () => {
      // (C1) GET HTML ELEMENTS
      bill.blWrap = document.getElementById("blWrap");
      bill.blList = document.getElementById("blList");
      bill.bfWrap = document.getElementById("bfWrap");
      bill.bfTitle = document.getElementById("bfTitle");
      bill.bfForm = document.getElementById("bfForm");
      bill.bfiForm = document.getElementById("bfiForm");
      bill.bftForm = document.getElementById("bftForm");
      bill.bfiList = document.getElementById("bfiList");
      bill.bftList = document.getElementById("bftList");
      bill.bftSub = document.getElementById("bftSub");
      bill.bftGrand = document.getElementById("bftGrand");
  
      // (C2) LOAD BILLS LIST
      bill.list();
    },
  
    // (D) LIST BILLS
    list : () => bill.ajax({ req:"getAll" }, data => {
      // (D1) INIT DATA
      data = JSON.parse(data);
  
      // (D2) DRAW LIST
      bill.blList.innerHTML = "";
      if (data.length!=0) { for (let b of data) {
        let row = document.createElement("div");
        row.className = "bRow flex";
        row.innerHTML = `<div class="blInfo">
          <div>${b["bill_to"]}</div>
          <div>${b["bill_ship"]}</div>
        </div>
        <div class="blBtn ico" onclick="bill.del(${b["bill_id"]})">&#10006;</div>
        <div class="blBtn ico" onclick="bill.toggle(${b["bill_id"]})">&#9998;</div>
        <a class="blBtn ico" target="_blank" href="print.php?id=${b["bill_id"]}">&#10151;</a>`;
        bill.blList.appendChild(row);
      }} else { bill.blList.innerHTML = "<div class='bRow flex'>No bills found.</div>"; }
    }),
  
    // (E) DELETE BILL
    del : id => { if (confirm("Delete bill?")) {
      bill.ajax({ req:"del", id:id }, res => {
        if (res=="OK") { bill.list(); }
        else { alert(res); }
      });
    }},
  
    // (F) TOGGLE BILLS LIST & FORM
    toggle : id => {
      // (F1) SWITCH TO BILLS LIST
      if (id===false) {
        bill.bfWrap.classList.add("hide");
        bill.blWrap.classList.remove("hide");
      } else {
        // (F2) RESET & SWITCH TO BILL FORM
        bill.bfTitle.innerHTML = id==0 ? "NEW BILL" : "EDIT BILL";
        bill.bfForm.reset();
        bill.bfiForm.reset();
        bill.bftForm.reset();
        bill.bfiList.innerHTML = "";
        bill.bftList.innerHTML = "";
        bill.bftSub.innerHTML = "0.00";
        bill.bftGrand.innerHTML = "0.00";
        document.getElementById("bfID").value = (id!=0 ? id : "");
        bill.blWrap.classList.add("hide");
        bill.bfWrap.classList.remove("hide");
  
        // (F3) EDIT - GET & SET BILL FORM
        if (id!=0) {
          bill.ajax({ req:"get", id:id }, data => {
            // (F3-1) SET FORM FIELDS
            data = JSON.parse(data);
            document.getElementById("bfBill").value = data["bill_to"];
            document.getElementById("bfShip").value = data["bill_ship"];
            document.getElementById("bfNotes").value = data["bill_notes"];
            document.getElementById("bfDOP").value = data["bill_dop"];
            document.getElementById("bfDue").value = data["bill_due"];
  
            // (F3-2) ITEMS & TOTALS
            for (let i of data.items) { bill.hRow(1, i); }
            for (let t of data.totals) {
              if (t[0]=="Sub Total") { bill.bftSub.innerHTML = t[1]; }
              else if (t[0]=="Grand Total") { bill.bftGrand.innerHTML = t[1]; }
              else { bill.hRow(2, t); }
            }
          });
        }
      }
    },
  
    // (G) CREATE AN HTML ITEM/TOTAL ROW
    hRow : (type, data) => {
      // (G1) NEW HTML ROW
      let row = document.createElement("div");
      row.className = "bRow flex";
      row.dataset.type = type;
  
      // (G2) ITEM ROW
      if (type==1) {
        row.innerHTML = `<div class="bDel ico" onclick="bill.dRow(this);">&#10006;</div>
        <div class="bfInfo">
          <div class="bfiName">${data[0]}</div>
          <div class="bfiDesc">${data[1]==null?"":data[1]}</div>
          <div>
            <span class="bfiQty">${data[2]}</span> X $
            <span class="bfiEach">${data[3]}</span> = 
            $<span class="bfiAmt">${data[4]}</span>
          </div>
        </div>`;
      }
  
      // (G3) TOTAL ROW
      else {
        row.innerHTML = `<div class="bDel ico" onclick="bill.dRow(this);">&#10006;</div>
          <div class="bfInfo bftTitle">${data[0]}</div>
          <div class="bftAmt">$<i>${data[1]}</i></div>`;
      }
  
      // (G4) DRAGGABLE
      row.draggable = true;
      row.ondragstart = () => bill.dragged = row;
      row.ondragover = evt => evt.preventDefault();
      row.ondrop = evt => bill.sort(evt);
  
      // (G5) ATTACH TO LIST
      if (type==1) { bill.bfiList.appendChild(row); }
      else { bill.bftList.appendChild(row); }
    },
  
    // (H) ADD ITEM/TOTAL ROW
    aRow : type => {
      // (H1) ITEM ROW
      if (type==1) {
        bill.hRow(1, [
          document.getElementById("bfiName").value,
          document.getElementById("bfiDesc").value,
          document.getElementById("bfiQty").value,
          document.getElementById("bfiEach").value,
          (parseFloat(document.getElementById("bfiQty").value) * parseFloat(document.getElementById("bfiEach").value)).toFixed(2)
        ]);
        bill.bfiForm.reset();
      }
  
      // (H2) TOTAL ROW
      else {
        bill.hRow(2, [
          document.getElementById("bftName").value,
          document.getElementById("bftAmt").value
        ]);
        bill.bftForm.reset();
      }
  
      // (H3) RECALCULATE & DONE
      bill.recalc();
      return false;
    },
  
    // (I) DELETE ROW
    dRow : row => {
      row.parentElement.remove();
      bill.recalc();
    },
    
    // (J) RECALCULATE TOTALS
    recalc : () => {
      // (J1) SUB TOTAL - ITEMS
      let total = 0;
      for (let i of document.querySelectorAll("#bfiList .bfiAmt")) {
        total += parseFloat(i.innerHTML);
      }
      bill.bftSub.innerHTML = total.toFixed(2);
  
      // (J2) GRAND TOTAL - ADD/MINUS USER-DEFINED
      for (let i of document.querySelectorAll("#bftList .bftAmt i")) {
        total += parseFloat(i.innerHTML);
      }
      bill.bftGrand.innerHTML = total.toFixed(2);
    },
  
    // (K) DRAG-DROP SORT
    dragged : null, // current dragged row
    sort : evt => {
      // (K1) PREVENT DEFAULT DROP
      evt.preventDefault();
  
      // (K2) GET PROPER DROPPED TARGET
      let target = evt.target;
      while (target.dataset.type === undefined) {
        target = target.parentElement;
      }
  
      // (K3) CHECK VALID DROP TARGET
      if (bill.dragged == target) { return false; }
      if (bill.dragged.dataset.type != target.dataset.type) { return false; }
  
      // (K4) GET CURRENT AND DROPPED POSITION
      let all = bill.dragged.dataset.type==1 
        ? document.querySelectorAll("#bfiList .bRow")
        : document.querySelectorAll("#bftList .bRow") ,
      currentpos = 0, droppedpos = 0;
      for (let i=0; i<all.length; i++) {
        if (bill.dragged == all[i]) { currentpos = i; }
        if (target == all[i]) { droppedpos = i; }
      }
  
      // (K5) REARRANGE
      if (currentpos < droppedpos) {
        target.parentNode.insertBefore(bill.dragged, target.nextSibling);
      } else {
        target.parentNode.insertBefore(bill.dragged, target);
      }
    },
  
    // (L) SAVE
    save : () => {
      // (L1) FORM CHECK
      if (!bill.bfForm.checkValidity()) {
        bill.bfForm.reportValidity();
        return false;
      }
      let dop = document.getElementById("bfDOP").value,
          due = document.getElementById("bfDue").value;
      if (new Date(due) < new Date(dop)) {
        alert("Due date cannot be before date of purchase");
        return false;
      }
  
      // (L2) COLLECT ITEMS + CHECK
      let data = { items : [], totals : [] },
          all = document.querySelectorAll("#bfiList .bRow");
      if (all.length == 0) {
        alert("There are no items!");
        return false;
      }
      for (let i of all) {
        data["items"].push({
          n : i.querySelector(".bfiName").innerHTML,
          d : i.querySelector(".bfiDesc").innerHTML,
          q : i.querySelector(".bfiQty").innerHTML,
          e : i.querySelector(".bfiEach").innerHTML,
          a : i.querySelector(".bfiAmt").innerHTML
        });
      }
      data["items"] = JSON.stringify(data["items"]);
  
      // (L3) TOTALS
      data.totals.push({ n : "Sub Total", a : bill.bftSub.innerHTML });
      all = document.querySelectorAll("#bftList .bRow");
      if (all.length>0) { for (let i of all) {
        data.totals.push({
          n : i.querySelector(".bftTitle").innerHTML,
          a : i.querySelector(".bftAmt i").innerHTML
        });
      }}
      data.totals.push({ n : "Grand Total", a : bill.bftGrand.innerHTML });
      data["totals"] = JSON.stringify(data["totals"]);
  
      // (L4) BILLING INFORMATION
      data["req"] = "save";
      data["id"] = document.getElementById("bfID").value;
      data["to"] = document.getElementById("bfBill").value;
      data["ship"] = document.getElementById("bfShip").value;
      data["notes"] = document.getElementById("bfNotes").value;
      data["notes"] = document.getElementById("bfNotes").value;
      data["dop"] = document.getElementById("bfDOP").value;
      data["due"] = document.getElementById("bfDue").value;
      if (data["id"]=="") { delete data["id"]; }
  
      // (L5) GO
      bill.ajax(data, res => {
        if (res=="OK") {
          bill.toggle(false);
          bill.list();
        } else { alert(res); }
      });
    }
  };
  window.onload = bill.init;