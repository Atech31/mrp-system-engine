// Use 'var' so browser refreshes/redeclarations don't throw SyntaxError
/*var API_BASE = 'http://localhost:8083/api';
*/

var API_BASE = '/api';
document.addEventListener('DOMContentLoaded', () => {
    loadInventory();
    loadBomLinks();
});

/*//////////////////////*/
window.switchTab = function(tabId, element) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active-content'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const targetElement = document.getElementById(tabId);
    if (targetElement) {
        targetElement.classList.add('active-content');
    }

    if (element) {
        element.classList.add('active');
    }

    // Trigger loads for both naming styles ('bom' or 'bom-tab')
    if (tabId === 'bom' || tabId === 'bom-tab') {
        populateBomDropdowns();
        loadBomLinks();
    }

    if (tabId === 'mrp-tab' || tabId === 'mrp') {
        populateMrpDropdown();
    }
};
/*//////////////////////*/



window.loadInventory = async function() {
    try {
        const res = await fetch(`${API_BASE}/items`);
        const items = await res.json();
        const list = Array.isArray(items) ? items : [];
        
        const totalItemsEl = document.getElementById('kpi-total-items');
        if (totalItemsEl) totalItemsEl.innerText = list.length;

        const tbody = document.getElementById('partTableBody');
        if (!tbody) return;

        tbody.innerHTML = list.length === 0 
            ? `<tr><td colspan="5" style="text-align:center; color:#94a3b8;">No inventory items available.</td></tr>`
            : list.map(item => {
                const nameVal = item.itemName || 'Unnamed Item';
                const stockVal = item.stockQuantity ?? 0;
                const leadTimeVal = item.leadTime ?? 0;
                return `
                    <tr>
                        <td><strong>#${item.id}</strong></td>
                        <td>${nameVal}</td>
                        <td>${stockVal} units</td>
                        <td>${leadTimeVal} days</td>
                        <td><button class="btn-action-delete" onclick="deleteItem(${item.id})">Delete</button></td>
                    </tr>
                `;
            }).join('');
    } catch (err) { 
        console.error('Error loading inventory:', err); 
    }
};

window.saveItem = async function() {
    const name = document.getElementById('itemName').value.trim();
    const stock = parseInt(document.getElementById('stock').value) || 0;
    const leadTime = parseInt(document.getElementById('leadTime').value) || 0;

    if (!name) { alert('Please enter Item Name.'); return; }

    try {
        await fetch(`${API_BASE}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                itemName: name, 
                stockQuantity: stock,
                leadTime: leadTime
            })
        });

        document.getElementById('itemName').value = '';
        document.getElementById('stock').value = '';
        document.getElementById('leadTime').value = '';
        loadInventory();
    } catch (err) { console.error('Error saving item:', err); }
};

window.deleteItem = async function(id) {
    if (!confirm(`Are you sure you want to delete item #${id}?`)) return;

    try {
        const res = await fetch(`${API_BASE}/items/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            loadInventory();
        } else {
            console.error('Failed to delete item:', res.statusText);
        }
    } catch (err) {
        console.error('Error deleting item:', err);
    }
};

window.populateBomDropdowns = async function() {
    try {
        const res = await fetch(`${API_BASE}/items`);
        const list = await res.json();
        const parentSelect = document.getElementById('parentSelect');
        const childSelect = document.getElementById('childSelect');
        if (!parentSelect || !childSelect) return;

        const optionsHtml = (Array.isArray(list) ? list : []).map(item => 
            `<option value="${item.id}">${item.itemName} (#${item.id})</option>`
        ).join('');

        parentSelect.innerHTML = `<option value="">Select Parent Item</option>` + optionsHtml;
        childSelect.innerHTML = `<option value="">Select Child Component</option>` + optionsHtml;
    } catch (err) { console.error('Error populating dropdowns:', err); }
};


/*/////////////////////*/


window.loadBomLinks = async function() {
    try {
        // Fetch both items and BOM links to map names instead of IDs
        const [itemsRes, bomRes] = await Promise.all([
            fetch(`${API_BASE}/items`),
            fetch(`${API_BASE}/bom`)
        ]);

        if (!bomRes.ok) return;

        const items = await itemsRes.json();
        const links = await bomRes.json();
        
        const itemList = Array.isArray(items) ? items : [];
        const bomList = Array.isArray(links) ? links : [];

        // Update KPI
        const bomKpi = document.getElementById('kpi-bom-links');
        if (bomKpi) bomKpi.innerText = bomList.length;

        // Create a quick lookup map: ID -> Item Name
        const itemMap = {};
        itemList.forEach(item => {
            itemMap[item.id] = item.itemName;
        });

        const tbody = document.getElementById('bomTableBody');
        if (!tbody) return;

        tbody.innerHTML = (bomList.length === 0)
            ? `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No BOM relationships created yet.</td></tr>`
            : bomList.map(link => {
                const parentName = itemMap[link.parentItemId] || `Item ${link.parentItemId}`;
                const childName = itemMap[link.childItemId] || `Item ${link.childItemId}`;

                return `
                    <tr>
                        <td><strong>${link.id}</strong></td>
                        <td>${parentName}</td>
                        <td>${childName}</td>
                        <td>${link.quantityRequired} units</td>
                    </tr>
                `;
            }).join('');
    } catch (err) { 
        console.error('Error loading BOM links:', err); 
    }
};


window.resetSystem = async function() {
    if (!confirm("Are you sure you want to reset all inventory and BOM links?")) return;

    try {
        // Option A: Call specialized reset API if available
        const resetRes = await fetch(`${API_BASE}/reset`, { method: 'POST' });

        if (!resetRes.ok) {
            // Option B: Fallback - Delete records via REST endpoints
            await fetch(`${API_BASE}/bom`, { method: 'DELETE' });
            await fetch(`${API_BASE}/items`, { method: 'DELETE' });
        }

        alert("System reset successfully!");
        location.reload(); // Refresh to reflect wiped data
    } catch (err) {
        console.error("Failed to reset system:", err);
        alert("Error resetting system. Check browser console or backend logs.");
    }
};

// 1. Populate Finished Goods Dropdown when tab is loaded
window.populateMrpDropdown = async function() {
    try {
        const res = await fetch(`${API_BASE}/items`);
        if (!res.ok) return;
        const items = await res.json();
        
        const select = document.getElementById('mrpFinishedGoodSelect'); // Ensure this ID matches your HTML
        if (!select) return;

        select.innerHTML = '<option value="">Select Target Finished Good...</option>';
        items.forEach(item => {
            select.innerHTML += `<option value="${item.id}">${item.itemName}</option>`;
        });
    } catch (err) {
        console.error('Error fetching items for MRP dropdown:', err);
    }
};

/*///////////////////////////////////////*/

// 2. Execute MRP Calculation
window.calculateMrp = async function() {
    const productId = document.getElementById('mrpFinishedGoodSelect').value;
    const quantity = document.getElementById('mrpQuantity').value;

    if (!productId || !quantity || quantity <= 0) {
        alert("Please select a finished good and enter a valid quantity.");
        return;
    }

    try {
        // Fix: Added leading slash before api/mrp/calculate
        const response = await fetch(`/api/mrp/calculate?productId=${productId}&quantity=${quantity}`, {
            method: 'POST'
        });

        if (!response.ok) throw new Error("Calculation failed");

        const results = await response.json();
        renderMrpResults(results);
    } catch (err) {
        console.error('Error calculating MRP:', err);
        alert("Failed to calculate MRP. Ensure backend endpoint /api/mrp/calculate is active.");
    }
};

/*///////////////////////////////////////*/

// 3. Render Calculation Results
 
function renderMrpResults(results) {
    const tbody = document.getElementById('mrpTableBody');
    if (!tbody) return;

    if (!results || results.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94a3b8;">No purchasing requirements generated.</td></tr>`;
        return;
    }

    tbody.innerHTML = results.map(row => {
        // Read properties with fallbacks matching MrpResult Java fields
        const itemId = row.itemId || row.id || row.partId || '-';
        const componentName = row.componentName || row.partName || row.itemName || 'N/A';
        const grossReq = row.grossRequirement ?? 0;
        const onHand = row.onHandStock ?? row.currentStock ?? 0;
        const netReq = row.netRequirement ?? 0;
        const leadTime = row.leadTime ?? row.leadTimeDays ?? 0;

        const statusBadge = netReq > 0 
            ? `<span class="badge badge-buy" style="color: #f87171;">Action Required: Buy (${netReq} units)</span>` 
            : `<span class="badge badge-ok" style="color: #4ade80;">Stock Sufficient</span>`;

        return `
            <tr>
                <td><strong>${itemId}</strong></td>
                <td>${componentName}</td>
                <td>${grossReq} units</td>
                <td>${onHand} units</td>
                <td><strong>${netReq} units</strong></td>
                <td>${leadTime} Days</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join('');
}


/*/////////////////////*/

window.saveBomLink = async function() {
    const parentItemId = parseInt(document.getElementById('parentSelect').value);
    const childItemId = parseInt(document.getElementById('childSelect').value);
    const quantityRequired = parseInt(document.getElementById('bomQuantity').value) || 0;

    if (!parentItemId || !childItemId || quantityRequired <= 0) {
        alert('Please select both items and enter valid quantity.');
        return;
    }

    try {
        await fetch(`${API_BASE}/bom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parentItemId, childItemId, quantityRequired })
        });
        document.getElementById('bomQuantity').value = '';
        loadBomLinks();
    } catch (err) { console.error('Error saving BOM link:', err); }
};
