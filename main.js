// =========================================================
// 통합 main.js (오류 수정 및 기능 통합 완료)
// =========================================================

// [1] 전역 변수 선언
let MEM_RECORDS = []; 
let MEM_LOCATIONS = {}; 
let MEM_FARES = {}; 
let MEM_CENTERS = []; 
let MEM_DISTANCES = {}; 
let MEM_COSTS = {}; 
let MEM_EXPENSE_ITEMS = []; 
let MEM_SALARIES = {}; 
let MEM_FIXED_EXPENSES = [];

// [2] 데이터 로드 및 저장 함수
function loadAllData() {
    try {
        const records = JSON.parse(localStorage.getItem('records')) || []; 
        MEM_RECORDS = Array.isArray(records) ? records : [];
        MEM_LOCATIONS = JSON.parse(localStorage.getItem('saved_locations')) || {}; 
        MEM_FARES = JSON.parse(localStorage.getItem('saved_fares')) || {};
        const centers = JSON.parse(localStorage.getItem('logistics_centers')) || []; 
        MEM_CENTERS = Array.isArray(centers) ? centers : [];
        if (MEM_CENTERS.length === 0) MEM_CENTERS.push('안성', '안산', '용인', '이천', '인천'); 
        MEM_CENTERS.sort(); 
        MEM_DISTANCES = JSON.parse(localStorage.getItem('saved_distances')) || {}; 
        MEM_COSTS = JSON.parse(localStorage.getItem('saved_costs')) || {};
        MEM_EXPENSE_ITEMS = JSON.parse(localStorage.getItem('saved_expense_items')) || []; 
        MEM_SALARIES = JSON.parse(localStorage.getItem('saved_salaries')) || {};
        MEM_FIXED_EXPENSES = JSON.parse(localStorage.getItem('saved_fixed_expenses')) || [];
        syncHistoryToAutocompleteDB();
    } catch (e) { console.error("데이터 로드 중 오류:", e); }
}

function saveData() {
    MEM_RECORDS.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    localStorage.setItem('records', JSON.stringify(MEM_RECORDS)); 
    localStorage.setItem('saved_locations', JSON.stringify(MEM_LOCATIONS)); 
    localStorage.setItem('saved_fares', JSON.stringify(MEM_FARES));
    MEM_CENTERS.sort(); 
    localStorage.setItem('logistics_centers', JSON.stringify(MEM_CENTERS));
    localStorage.setItem('saved_distances', JSON.stringify(MEM_DISTANCES)); 
    localStorage.setItem('saved_costs', JSON.stringify(MEM_COSTS));
    localStorage.setItem('saved_expense_items', JSON.stringify(MEM_EXPENSE_ITEMS)); 
    localStorage.setItem('saved_salaries', JSON.stringify(MEM_SALARIES));
    localStorage.setItem('saved_fixed_expenses', JSON.stringify(MEM_FIXED_EXPENSES));
}

function syncHistoryToAutocompleteDB() { 
    let updated = false; 
    MEM_RECORDS.forEach(r => { 
        if (r.type === '화물운송' && r.from && r.to) { 
            const key = `${r.from.trim()}-${r.to.trim()}`; 
            if (r.income > 0 && !MEM_FARES[key]) { MEM_FARES[key] = r.income; updated = true; } 
            if (r.distance > 0 && !MEM_DISTANCES[key]) { MEM_DISTANCES[key] = r.distance; updated = true; } 
            if (r.cost > 0 && !MEM_COSTS[key]) { MEM_COSTS[key] = r.cost; updated = true; } 
        } 
    }); 
    if (updated) saveData(); 
}

function addRecord(record) { 
    if (record.type === '화물운송' && record.from && record.to) { 
        const key = `${record.from}-${record.to}`; 
        if(record.income > 0) MEM_FARES[key] = record.income; 
        if(record.distance > 0) MEM_DISTANCES[key] = record.distance; 
        if(record.cost > 0) MEM_COSTS[key] = record.cost; 
    } 
    MEM_RECORDS.push(record); 
    saveData(); 
}

function removeRecord(id) { 
    const idx = MEM_RECORDS.findIndex(r => r.id === id); 
    if(idx > -1) { MEM_RECORDS.splice(idx, 1); saveData(); } 
}

function updateLocationData(name, address, memo) { 
    if (!name) return; 
    const trimmed = name.trim(); 
    if (!MEM_CENTERS.includes(trimmed)) { MEM_CENTERS.push(trimmed); MEM_CENTERS.sort(); } 
    if (address || memo) MEM_LOCATIONS[trimmed] = { ...(MEM_LOCATIONS[trimmed] || {}), address: address || '', memo: memo || '' }; 
    saveData(); 
}

function updateExpenseItemData(item) { 
    if (!item) return; 
    const trimmed = item.trim(); 
    if (!MEM_EXPENSE_ITEMS.includes(trimmed)) { MEM_EXPENSE_ITEMS.push(trimmed); MEM_EXPENSE_ITEMS.sort(); saveData(); } 
}

// [3] 유틸리티 함수
const getTodayString = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const getCurrentTimeString = () => { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
const formatToManwon = (val) => isNaN(val) ? '0' : Math.round(val / 10000).toLocaleString('ko-KR');

function showToast(msg) {
    const toast = document.getElementById('toast-notification');
    if(toast){
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1500);
    }
}

function copyTextToClipboard(text, msg) {
    if (!text) { showToast('복사할 주소가 없습니다.'); return; }
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select();
    try { 
        document.execCommand('copy'); 
        showToast(msg || '주소가 복사되었습니다.'); 
    } catch (e) { 
        if (navigator.clipboard) { navigator.clipboard.writeText(text).then(() => showToast(msg || '주소가 복사되었습니다.')).catch(err => console.log('복사 실패:', err)); } 
    }
    document.body.removeChild(ta);
}

function getStatisticalDate(dateStr, timeStr) {
    if (!dateStr || !timeStr) return dateStr;
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (hour >= 4) return dateStr;
    const d = new Date(dateStr);
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function safeInt(value) { if (!value) return 0; const num = parseInt(String(value).replace(/,/g, ''), 10); return isNaN(num) ? 0 : num; }
function safeFloat(value) { if (!value) return 0; const num = parseFloat(String(value).replace(/,/g, '')); return isNaN(num) ? 0 : num; }

function moveDate(offset, updateCallback) {
    const picker = document.getElementById('today-date-picker');
    if (!picker || !picker.value) return;
    const d = new Date(picker.value);
    d.setDate(d.getDate() + offset);
    picker.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if(updateCallback) updateCallback();
}

function changeDateSelect(yId, mId, delta, updateCallback) {
    const yEl = document.getElementById(yId); const mEl = document.getElementById(mId);
    if(!yEl || !mEl) return;
    const d = new Date(parseInt(yEl.value), parseInt(mEl.value) - 1 + delta, 1);
    yEl.value = d.getFullYear(); mEl.value = String(d.getMonth() + 1).padStart(2, '0');
    if(updateCallback) updateCallback();
}

// [4] 화면 UI 제어
function controlSectionByText(keyword, show) {
    const knownIds = { '기록 일시': ['basic-info-section', 'datetime-info-fieldset', 'date-fieldset'], '기록 종류': ['type-fieldset'], '금액 정보': ['cost-info-fieldset'] };
    if(knownIds[keyword]) { knownIds[keyword].forEach(id => { const el = document.getElementById(id); if(el) { el.style.display = show ? 'block' : 'none'; if(!show) el.classList.add('hidden'); else el.classList.remove('hidden'); } }); }
    const labels = document.querySelectorAll('legend, h3, h4, h5, label, span.section-title');
    labels.forEach(el => { if (el.textContent.trim().includes(keyword)) { const container = el.closest('fieldset') || el.closest('.section') || el.parentElement; if (container) container.style.display = show ? 'block' : 'none'; } });
}

window.toggleSection = function(sectionId, btnElement) {
    const section = document.getElementById(sectionId); if (!section) return;
    const isHidden = section.classList.contains('hidden') || section.style.display === 'none';
    if (isHidden) {
        section.classList.remove('hidden'); section.style.display = 'block'; 
        if (btnElement) { let txt = btnElement.innerHTML; if(txt.includes('보기')) btnElement.innerHTML = txt.replace('보기', '접기'); else if(txt.includes('펴기')) btnElement.innerHTML = txt.replace('펴기', '접기').replace('▼', '▲'); else btnElement.innerHTML = '접기 ▲'; }
        if (sectionId === 'sms-parser-section') { const smsInput = document.getElementById('sms-input'); if (smsInput) { smsInput.style.height = 'auto'; smsInput.style.height = (smsInput.scrollHeight) + 'px'; } }
    } else {
        section.classList.add('hidden'); section.style.display = 'none';
        if (btnElement) { let txt = btnElement.innerHTML; if(txt.includes('접기')) btnElement.innerHTML = txt.replace('접기', '보기').replace('▲', '▼'); else btnElement.innerHTML = '펴기 ▼'; }
    }
};

function toggleUI() {
    const typeSelect = document.getElementById('type'); const editModeIndicator = document.getElementById('edit-mode-indicator'); const smsSection = document.getElementById('sms-parser-section'); if(!typeSelect) return;
    const type = typeSelect.value; const isEditMode = editModeIndicator && !editModeIndicator.classList.contains('hidden');
    const sections = ['fuel-details', 'supply-details', 'expense-details', 'trip-actions', 'general-actions', 'edit-actions']; sections.forEach(id => { const el = document.getElementById(id); if(el) el.classList.add('hidden'); });
    const transportDetails = document.getElementById('transport-details'); const costInfo = document.getElementById('cost-info-fieldset'); const costWrapper = document.getElementById('cost-wrapper'); const incomeWrapper = document.getElementById('income-wrapper');
    if (type === '운행종료') { if(transportDetails) transportDetails.classList.add('hidden'); if(costInfo) costInfo.classList.add('hidden'); controlSectionByText('기록 일시', false); controlSectionByText('기록 종류', false); return; }
    if (isEditMode) { if(smsSection) smsSection.classList.add('hidden'); if(document.getElementById('edit-actions')) document.getElementById('edit-actions').classList.remove('hidden'); } else { if (['화물운송', '대기'].includes(type)) document.getElementById('trip-actions')?.classList.remove('hidden'); else document.getElementById('general-actions')?.classList.remove('hidden'); }
    if (type === '화물운송' || type === '대기') { costWrapper?.classList.add('hidden'); incomeWrapper?.classList.remove('hidden'); } else { if(transportDetails) transportDetails.classList.add('hidden'); incomeWrapper?.classList.add('hidden'); costWrapper?.classList.remove('hidden'); if (type === '주유소') document.getElementById('fuel-details')?.classList.remove('hidden'); else if (type === '지출') { const expSection = document.getElementById('expense-details'); if(expSection) { expSection.classList.remove('hidden'); if(!document.getElementById('expense-memo')) { const div = document.createElement('div'); div.style.marginTop = '10px'; div.innerHTML = `<label style="display:block; color:#666; font-size:0.9em; margin-bottom:4px;">메모 (선택)</label><input type="text" id="expense-memo" placeholder="비고/상세내용" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px;">`; expSection.appendChild(div); } } } else if (type === '소모품') document.getElementById('supply-details')?.classList.remove('hidden'); }
}

function getFormDataWithoutTime() {
    const typeVal = document.getElementById('type').value; let memoVal = ''; if(typeVal === '지출') { const memoInput = document.getElementById('expense-memo'); if(memoInput) memoVal = memoInput.value.trim(); }
    return { type: typeVal, from: document.getElementById('from-center').value.trim(), to: document.getElementById('to-center').value.trim(), distance: parseFloat(document.getElementById('manual-distance').value) || 0, cost: Math.round((parseFloat(document.getElementById('cost').value) || 0) * 10000), income: Math.round((parseFloat(document.getElementById('income').value) || 0) * 10000), expenseItem: document.getElementById('expense-item')?.value || '', supplyItem: document.getElementById('supply-item')?.value || '', supplyMileage: document.getElementById('supply-mileage')?.value || '', liters: document.getElementById('fuel-liters')?.value || 0, unitPrice: document.getElementById('fuel-unit-price')?.value || 0, brand: document.getElementById('fuel-brand')?.value || '', memo: memoVal };
}

function resetForm() {
    document.getElementById('record-form')?.reset(); document.getElementById('edit-id').value = ''; document.getElementById('edit-mode-indicator')?.classList.add('hidden'); document.getElementById('date').value = getTodayString(); document.getElementById('time').value = getCurrentTimeString(); document.getElementById('date').disabled = false; document.getElementById('time').disabled = false;
    const displayEl = document.getElementById('address-display'); if(displayEl) { displayEl.innerHTML = ''; displayEl.style.display = 'none'; } const dtField = document.getElementById('datetime-info-fieldset'); if(dtField) dtField.style.display = 'none'; const typeLegend = document.getElementById('legend-type'); if(typeLegend) { const f = typeLegend.closest('fieldset'); if(f) f.style.display = 'none'; }
    ['transport-details', 'cost-info-fieldset'].forEach(id => { const el = document.getElementById(id); if(el) { el.classList.add('hidden'); el.style.display = 'none'; } }); ['toggle-basic-info-btn', 'toggle-location-section-btn', 'toggle-cost-section-btn'].forEach(id => { const btn = document.getElementById(id); if(btn) btn.innerHTML = '펴기 ▼'; }); toggleUI();
}

function editRecord(id) {
    const r = MEM_RECORDS.find(x => x.id === id); if(!r) return;
    document.getElementById('date').value = r.date; document.getElementById('time').value = r.time; document.getElementById('type').value = r.type;
    if(document.getElementById('from-center')) document.getElementById('from-center').value = r.from || ''; if(document.getElementById('to-center')) document.getElementById('to-center').value = r.to || ''; if(document.getElementById('manual-distance')) document.getElementById('manual-distance').value = r.distance || ''; if(document.getElementById('income')) document.getElementById('income').value = r.income ? (r.income/10000) : ''; if(document.getElementById('cost')) document.getElementById('cost').value = r.cost ? (r.cost/10000) : ''; if(document.getElementById('expense-item')) document.getElementById('expense-item').value = r.expenseItem || '';
    toggleUI(); if(r.type === '지출') { const memoInput = document.getElementById('expense-memo'); if(memoInput) memoInput.value = r.memo || ''; }
    document.getElementById('edit-id').value = id; document.getElementById('edit-mode-indicator')?.classList.remove('hidden'); document.getElementById('date').disabled = false; document.getElementById('time').disabled = false;
    const dtField = document.getElementById('datetime-info-fieldset'); if(dtField) { dtField.style.display = 'block'; dtField.classList.remove('hidden'); } const dtBody = document.getElementById('body-datetime'); if(dtBody) dtBody.style.display = 'block'; const typeLegend = document.getElementById('legend-type'); if(typeLegend) { const f = typeLegend.closest('fieldset'); if(f) { f.style.display = 'block'; f.classList.remove('hidden'); } } const typeBody = document.getElementById('body-type'); if(typeBody) typeBody.style.display = 'block';
    ['transport-details', 'cost-info-fieldset'].forEach(sid => { const s = document.getElementById(sid); if(s) { s.classList.remove('hidden'); s.style.display = 'block'; } });
    const fromIn = document.getElementById('from-center'); const toIn = document.getElementById('to-center'); if(fromIn) fromIn.dispatchEvent(new Event('input')); if(toIn) toIn.dispatchEvent(new Event('input')); window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.openSettings = function() {
    const mainPage = document.getElementById('main-page'); const settingsPage = document.getElementById('settings-page'); const btnGo = document.getElementById('go-to-settings-btn'); const btnBack = document.getElementById('back-to-main-btn'); const editIndicator = document.getElementById('edit-mode-indicator');
    if (mainPage) mainPage.classList.add("hidden"); if (settingsPage) settingsPage.classList.remove("hidden"); if (btnGo) btnGo.classList.add("hidden"); if (btnBack) btnBack.classList.remove("hidden"); if (editIndicator) editIndicator.classList.add('hidden');
    try {
        if (typeof displayCumulativeData === 'function') displayCumulativeData(); if (typeof displayCurrentMonthData === 'function') displayCurrentMonthData(); if (typeof displaySubsidyRecords === 'function') displaySubsidyRecords(false); 
        const searchInput = document.getElementById('center-search-input'); if (typeof displayCenterList === 'function') displayCenterList(searchInput ? searchInput.value : '');
        if (typeof displaySavedSmsNumber === 'function') displaySavedSmsNumber(); if (typeof displaySalaryManager === 'function') displaySalaryManager(); if (typeof displayFixedExpenseManager === 'function') displayFixedExpenseManager();
        const limitInput = document.getElementById('subsidy-limit'); const limitBtn = document.getElementById('subsidy-save-btn'); if(limitInput) limitInput.parentElement.style.display = 'none'; if(limitBtn) limitBtn.style.display = 'none';
    } catch(e) { console.error(e); }
};
window.closeSettings = function() {
    const mainPage = document.getElementById('main-page'); const settingsPage = document.getElementById('settings-page'); const btnGo = document.getElementById('go-to-settings-btn'); const btnBack = document.getElementById('back-to-main-btn'); const editIndicator = document.getElementById('edit-mode-indicator'); const editId = document.getElementById('edit-id');
    if (mainPage) mainPage.classList.remove("hidden"); if (settingsPage) settingsPage.classList.add("hidden"); if (btnGo) btnGo.classList.remove("hidden"); if (btnBack) btnBack.classList.add("hidden"); if (editId && editId.value && editIndicator) editIndicator.classList.remove('hidden'); try { if (typeof updateAllDisplays === 'function') updateAllDisplays(); } catch(e) { }
};

// [5] 관리자 기능 (지역/SMS/급여/고정지출)
window.editCenter = function(oldName) {
    const loc = MEM_LOCATIONS[oldName] || {}; const newName = prompt("지역 이름 수정:", oldName); if (newName === null || newName.trim() === "") return; const newAddr = prompt("주소 수정:", loc.address || ""); if (newAddr === null) return; const newMemo = prompt("메모 수정:", loc.memo || ""); if (newMemo === null) return;
    if (newName !== oldName) { const idx = MEM_CENTERS.indexOf(oldName); if (idx > -1) MEM_CENTERS[idx] = newName; MEM_CENTERS.sort(); delete MEM_LOCATIONS[oldName]; }
    MEM_LOCATIONS[newName] = { address: newAddr, memo: newMemo }; saveData(); displayCenterList(document.getElementById('center-search-input')?.value || ''); showToast("수정되었습니다.");
};
window.deleteCenter = function(name) { if (!confirm(`'${name}' 지역을 삭제하시겠습니까?`)) return; const idx = MEM_CENTERS.indexOf(name); if (idx > -1) MEM_CENTERS.splice(idx, 1); delete MEM_LOCATIONS[name]; saveData(); displayCenterList(document.getElementById('center-search-input')?.value || ''); showToast("삭제되었습니다."); };
window.addNewCenterFromInput = function() {
    let input = document.getElementById('add-center-input') || document.getElementById('new-center-name'); if (!input) { const settingsPage = document.getElementById('settings-page'); if (settingsPage) { const inputs = settingsPage.querySelectorAll('input[type="text"]'); for(let i=0; i<inputs.length; i++) { if(inputs[i].placeholder && (inputs[i].placeholder.includes('지역') || inputs[i].placeholder.includes('이름'))) { input = inputs[i]; break; } } } }
    if (!input) return alert("입력창을 찾을 수 없습니다."); const name = input.value.trim(); if (!name) return alert("지역 이름을 입력해주세요."); if (MEM_CENTERS.includes(name)) { alert("이미 등록된 지역입니다."); input.value = ""; return; }
    updateLocationData(name, "", ""); input.value = ""; displayCenterList(document.getElementById('center-search-input')?.value || ''); showToast(`'${name}' 지역이 추가되었습니다.`);
};
function displayCenterList(filter='') { const container = document.getElementById('center-list-container'); if(!container) return; container.innerHTML = ""; const list = MEM_CENTERS.filter(c => c.toLowerCase().includes(filter.toLowerCase())); list.forEach(c => { const div = document.createElement('div'); div.className='center-item'; const locInfo = MEM_LOCATIONS[c] || {}; const infoText = locInfo.address ? `${c} (${locInfo.address})` : c; div.innerHTML=`<div class="info"><span class="center-name">${infoText}</span><div class="action-buttons"><button type="button" class="center-action-btn btn-edit" style="background:#17a2b8;" onclick="window.editCenter('${c}')">수정</button><button type="button" class="center-action-btn btn-delete" style="background:#dc3545;" onclick="window.deleteCenter('${c}')">삭제</button></div></div>`; container.appendChild(div); }); }
function populateCenterDatalist() { const dl = document.getElementById('center-list'); if(dl) dl.innerHTML = MEM_CENTERS.map(c => `<option value="${c}"></option>`).join(''); }
function populateExpenseDatalist() { const dl = document.getElementById('expense-list'); if(dl) dl.innerHTML = MEM_EXPENSE_ITEMS.map(item => `<option value="${item}"></option>`).join(''); }

function displaySavedSmsNumber() { const savedNum = localStorage.getItem('target_sms_number'); const displayDiv = document.getElementById('saved-sms-number-display'); if (!displayDiv) { const parent = document.getElementById('data-management-body'); if(parent) { const newDiv = document.createElement('div'); newDiv.id = 'saved-sms-number-display'; newDiv.style.marginTop = '5px'; newDiv.style.marginBottom = '10px'; newDiv.style.fontSize = '0.9em'; newDiv.style.color = '#007bff'; if(parent.children.length > 0) parent.insertBefore(newDiv, parent.children[1]); else parent.appendChild(newDiv); renderSmsNumberContent(newDiv, savedNum); } } else { renderSmsNumberContent(displayDiv, savedNum); } }
function renderSmsNumberContent(element, num) { if (num) element.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; background:#f1f8ff; padding:8px; border-radius:4px;"><span>저장된 번호: <strong>${num}</strong></span><button type="button" onclick="window.deleteSavedSmsNumber()" style="background:#dc3545; color:white; border:none; border-radius:3px; padding:4px 10px; font-size:0.8em; cursor:pointer;">삭제</button></div>`; else element.innerHTML = "<div style='padding:5px; color:#666;'>저장된 발신번호가 없습니다.</div>"; }
window.deleteSavedSmsNumber = function() { if(confirm('저장된 발신번호를 삭제하시겠습니까?')) { localStorage.removeItem('target_sms_number'); displaySavedSmsNumber(); const inputEl = document.getElementById('sms-target-number'); if(inputEl) inputEl.value = ''; showToast("삭제되었습니다."); } };

function displaySalaryManager() {
    if (typeof MEM_SALARIES === 'undefined') MEM_SALARIES = {};
    let container = document.getElementById('salary-management-container');
    if (!container) { const parent = document.getElementById('data-management-body'); if (!parent) return; container = document.createElement('div'); container.id = 'salary-management-container'; container.style.marginTop = '20px'; container.style.borderTop = '1px solid #eee'; container.style.paddingTop = '15px'; parent.appendChild(container); }
    const currentYear = new Date().getFullYear(); const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0'); let yearOpts = ''; for(let i=0; i<3; i++) yearOpts += `<option value="${currentYear-i}">${currentYear-i}년</option>`; let monthOpts = ''; for(let i=1; i<=12; i++) monthOpts += `<option value="${String(i).padStart(2,'0')}">${i}월</option>`;
    let listHtml = ''; Object.keys(MEM_SALARIES).sort().reverse().forEach(key => { const amount = MEM_SALARIES[key]; listHtml += `<div style="display:flex; justify-content:space-between; align-items:center; background:#f9f9f9; padding:12px; border-radius:6px; margin-bottom:8px; border:1px solid #eee;"><div style="font-size:1em; color:#333;"><strong style="margin-right:5px;">${key}</strong><div style="color:#007bff; font-weight:bold; font-size:1.1em; margin-top:2px;">${formatToManwon(amount)} 만원</div></div><div style="display:flex; gap:8px;"><button type="button" onclick="window.editSalary('${key}', ${amount})" style="background:#17a2b8; color:white; border:none; border-radius:4px; padding:8px 12px; font-weight:bold; font-size:0.9em;">수정</button><button type="button" onclick="window.deleteSalary('${key}')" style="background:#dc3545; color:white; border:none; border-radius:4px; padding:8px 12px; font-weight:bold; font-size:0.9em;">삭제</button></div></div>`; });
    if(!listHtml) listHtml = `<div style="color:#999; text-align:center; padding:20px; background:#f8f8f8; border-radius:5px;">내역이 없습니다.<br>급여를 등록해주세요.</div>`;
    container.innerHTML = `<h4 style="margin-bottom:12px; font-weight:bold; color:#333; font-size:1.1em;">💰 급여 설정 (월 고정수입)</h4><div style="display:flex; gap:5px; margin-bottom:8px;"><select id="salary-set-year" style="flex:1; padding:12px; border:1px solid #ccc; border-radius:5px; font-size:1em; background:#fff;">${yearOpts}</select><select id="salary-set-month" style="flex:1; padding:12px; border:1px solid #ccc; border-radius:5px; font-size:1em; background:#fff;">${monthOpts}</select></div><div style="display:flex; gap:5px; margin-bottom:20px;"><input type="tel" id="salary-set-amount" inputmode="numeric" placeholder="금액 입력 (원)" oninput="this.value = this.value.replace(/[^0-9]/g, '');" style="flex:2; padding:12px; border:1px solid #007bff; border-radius:5px; font-size:1.1em; font-weight:bold;"><button type="button" onclick="window.saveSalary()" style="flex:1; padding:12px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size:1em;">저장</button></div><div style="max-height:300px; overflow-y:auto; border-top:2px solid #f1f1f1; padding-top:15px;">${listHtml}</div>`;
    document.getElementById('salary-set-month').value = currentMonth;
}
window.saveSalary = function() { const y = document.getElementById('salary-set-year').value; const m = document.getElementById('salary-set-month').value; const amountInput = document.getElementById('salary-set-amount'); let rawVal = amountInput.value.replace(/[^0-9]/g, ''); const amount = parseInt(rawVal, 10); if (!rawVal || isNaN(amount) || amount <= 0) { alert('급여 금액을 입력해주세요.'); amountInput.focus(); return; } if (typeof MEM_SALARIES === 'undefined') MEM_SALARIES = {}; const key = `${y}-${m}`; MEM_SALARIES[key] = amount; saveData(); displaySalaryManager(); if (typeof updateAllDisplays === 'function') updateAllDisplays(); showToast(`${y}년 ${m}월 급여가 저장되었습니다.`); amountInput.value = ''; amountInput.blur(); };
window.editSalary = function(key, amount) { const [year, month] = key.split('-'); const yEl = document.getElementById('salary-set-year'); const mEl = document.getElementById('salary-set-month'); const aEl = document.getElementById('salary-set-amount'); if(yEl && mEl && aEl) { yEl.value = year; mEl.value = month; aEl.value = amount; aEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => { aEl.focus(); }, 300); showToast(`${year}년 ${month}월 수정 모드`); } };
window.deleteSalary = function(key) { if(!confirm(`${key} 급여 내역을 삭제하시겠습니까?`)) return; if (typeof MEM_SALARIES !== 'undefined') { delete MEM_SALARIES[key]; saveData(); displaySalaryManager(); if (typeof updateAllDisplays === 'function') updateAllDisplays(); showToast('삭제되었습니다.'); } };

function displayFixedExpenseManager() {
    let container = document.getElementById('expense-management-container');
    if (!container) { const parent = document.getElementById('data-management-body'); if (!parent) return; container = document.createElement('div'); container.id = 'expense-management-container'; container.style.marginTop = '20px'; container.style.borderTop = '1px solid #eee'; container.style.paddingTop = '15px'; const salaryContainer = document.getElementById('salary-management-container'); if (salaryContainer) salaryContainer.parentNode.insertBefore(container, salaryContainer.nextSibling); else parent.appendChild(container); }
    let monthOpts = `<option value="0">매월 (반복)</option>`; for(let i=1; i<=12; i++) monthOpts += `<option value="${i}">${i}월</option>`; let dayOpts = ''; for(let i=1; i<=31; i++) dayOpts += `<option value="${i}">${i}일</option>`;
    let listHtml = `<div style="max-height: 250px; overflow-y: auto; border: 1px solid #eee; border-radius: 4px; background: #fafafa;">`;
    if (MEM_FIXED_EXPENSES.length === 0) { listHtml += `<div style="padding:15px; text-align:center; color:#999;">등록된 고정 지출이 없습니다.<br>(예: 매월 25일 보험료 10만원)</div>`; } else {
        MEM_FIXED_EXPENSES.sort((a,b) => { const mA = a.month || 0; const mB = b.month || 0; if(mA !== mB) return mA - mB; return a.day - b.day; });
        MEM_FIXED_EXPENSES.forEach((item, index) => { const periodStr = (item.month && item.month > 0) ? `<span style="color:#d63384;">[매년 ${item.month}월]</span>` : `<span style="color:#007bff;">[매월]</span>`; listHtml += `<div style="background:white; padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;"><div style="flex:1;"><div style="font-weight:bold; color:#333;">${periodStr} ${item.day}일 - ${item.name}</div><div style="font-size:0.85em; color:#666; margin-top:2px;">${item.memo ? `📝 ${item.memo} | ` : ''} <strong style="color:#333;">${formatToManwon(item.cost)} 만원</strong></div></div><div style="display:flex; gap:5px; margin-left:5px;"><button type="button" onclick="window.editFixedExpense(${index})" style="background:#17a2b8; color:white; border:none; border-radius:4px; padding:6px 10px; font-size:0.8em;">수정</button><button type="button" onclick="window.deleteFixedExpense(${index})" style="background:#dc3545; color:white; border:none; border-radius:4px; padding:6px 10px; font-size:0.8em;">삭제</button></div></div>`; });
    }
    listHtml += `</div>`;
    container.innerHTML = `<h4 style="margin-bottom:10px; font-weight:bold; color:#333; font-size:1.1em;">💸 고정 지출 관리 (매월/연간)</h4><div style="background:#fff0f0; padding:10px; border-radius:5px; border:1px solid #f5c6cb; margin-bottom:10px;"><div style="display:flex; gap:5px; margin-bottom:5px;"><select id="fe-month" style="width:110px; padding:8px; border:1px solid #ccc; border-radius:4px;">${monthOpts}</select><select id="fe-day" style="width:70px; padding:8px; border:1px solid #ccc; border-radius:4px;">${dayOpts}</select><input type="text" id="fe-name" placeholder="항목명 (예: 보험료)" style="flex:1; padding:8px; border:1px solid #ccc; border-radius:4px;"></div><div style="display:flex; gap:5px; margin-bottom:5px;"><input type="text" id="fe-memo" placeholder="메모 (선택)" style="flex:1; padding:8px; border:1px solid #ccc; border-radius:4px;"></div><div style="display:flex; gap:5px;"><input type="tel" id="fe-cost" inputmode="numeric" placeholder="금액 (원)" oninput="this.value=this.value.replace(/[^0-9]/g,'')" style="flex:1; padding:8px; border:1px solid #007bff; border-radius:4px; font-weight:bold;"><button type="button" id="fe-save-btn" onclick="window.saveFixedExpense()" style="width:60px; background:#28a745; color:white; border:none; border-radius:4px; font-weight:bold;">추가</button></div><input type="hidden" id="fe-edit-index" value="-1"></div>${listHtml}`;
}
window.saveFixedExpense = function() {
    const month = parseInt(document.getElementById('fe-month').value) || 0; const day = parseInt(document.getElementById('fe-day').value); const name = document.getElementById('fe-name').value.trim(); const memo = document.getElementById('fe-memo').value.trim(); const cost = parseInt(document.getElementById('fe-cost').value.replace(/[^0-9]/g, '')); const editIdx = parseInt(document.getElementById('fe-edit-index').value);
    if (!name) { alert("항목 이름을 입력해주세요."); return; } if (isNaN(cost) || cost <= 0) { alert("금액을 입력해주세요."); return; }
    const newCheck = { month, day, name, memo, cost };
    if (editIdx > -1) { MEM_FIXED_EXPENSES[editIdx] = newCheck; showToast("수정되었습니다."); } else { MEM_FIXED_EXPENSES.push(newCheck); showToast("추가되었습니다."); }
    if(!MEM_EXPENSE_ITEMS.includes(name)) { MEM_EXPENSE_ITEMS.push(name); MEM_EXPENSE_ITEMS.sort(); }
    saveData(); displayFixedExpenseManager(); if(typeof updateAllDisplays === 'function') updateAllDisplays();
};
window.editFixedExpense = function(index) {
    const item = MEM_FIXED_EXPENSES[index]; if (!item) return;
    document.getElementById('fe-month').value = item.month || 0; document.getElementById('fe-day').value = item.day; document.getElementById('fe-name').value = item.name; document.getElementById('fe-memo').value = item.memo; document.getElementById('fe-cost').value = item.cost; document.getElementById('fe-edit-index').value = index;
    const btn = document.getElementById('fe-save-btn'); btn.textContent = "수정"; btn.style.background = "#17a2b8"; showToast("수정 모드: 내용을 변경하고 저장하세요.");
};
window.deleteFixedExpense = function(index) {
    if(!confirm("이 고정 지출 항목을 삭제하시겠습니까?")) return; MEM_FIXED_EXPENSES.splice(index, 1); saveData(); displayFixedExpenseManager(); if(typeof updateAllDisplays === 'function') updateAllDisplays(); showToast("삭제되었습니다.");
};

// [6] SMS / OCR / 통계 / 인쇄 / 초기화
function parseSmsText() {
    const inputEl = document.getElementById('sms-input'); const input = inputEl ? inputEl.value : ""; if (!input.trim()) { showToast("분석할 문자를 입력해주세요."); return; }
    const resultsDiv = document.getElementById('sms-parse-results'); if(!resultsDiv) return; resultsDiv.innerHTML = ""; resultsDiv.classList.remove('hidden'); resultsDiv.style.display = 'block';
    let allLines = input.split('\n'); if (allLines.length > 2) allLines = allLines.slice(2); 
    const validLines = allLines.filter(line => { const l = line.trim(); return l.length > 5 && !l.includes("Web발신"); }); const sortedCenters = [...MEM_CENTERS].sort((a, b) => b.length - a.length);
    validLines.forEach((line, lineIdx) => {
        let cleaned = line.trim().replace(/\d{1,2}월\s*\d{1,2}일/g, " ").replace(/배차표|운송장/g, " ").replace(/\d+층\s*->\s*\d+층/g, " "); let matches = []; let searchQueue = cleaned.toUpperCase();
        sortedCenters.forEach(center => { const centerUpper = center.toUpperCase(); let pos = searchQueue.indexOf(centerUpper); if (pos !== -1) { matches.push({ name: center, index: pos }); searchQueue = searchQueue.substring(0, pos) + " ".repeat(center.length) + searchQueue.substring(pos + center.length); } });
        matches.sort((a, b) => a.index - b.index); let finalFrom = matches[0] ? matches[0].name : ""; let finalTo = matches[1] ? matches[1].name : "";
        if (!finalFrom || !finalTo) { const words = cleaned.split(/\s+/).filter(w => w.trim().length >= 2); if (!finalFrom) finalFrom = words[0] || ""; if (!finalTo) finalTo = words[1] || ""; } if(!finalFrom && !finalTo) return;
        const itemDiv = document.createElement('div'); itemDiv.className = "sms-item-card";
        const buildLocInput = (label, id, value, color) => { const locInfo = MEM_LOCATIONS[value]; return `<div style="flex:1; display:flex; flex-direction:column; gap:4px;"><span style="font-size:0.75em; color:#666; font-weight:bold;">${label}</span><input type="text" id="${id}-name" value="${value}" list="center-list" oninput="window.handleSmsNameInput(this, '${id}-addr', '${id}-memo')" style="border:1px solid ${color}; border-radius:4px; padding:6px; font-weight:bold; color:${color}; font-size:0.95em;"><input type="text" id="${id}-addr" value="${locInfo?.address||''}" placeholder="주소" style="border:1px solid #ddd; padding:4px; font-size:0.8em; background:${locInfo?.address?'#f9f9f9':'#fff0f0'};"><input type="text" id="${id}-memo" value="${locInfo?.memo||''}" placeholder="메모" style="border:1px solid #ddd; padding:4px; font-size:0.8em;"></div>`; };
        itemDiv.innerHTML = `<div style="display:flex; gap:10px; margin-bottom:5px;">${buildLocInput('상차지', `from-${lineIdx}`, finalFrom, '#007bff')}<div style="align-self:center; font-weight:bold; color:#ccc;">▶</div>${buildLocInput('하차지', `to-${lineIdx}`, finalTo, '#dc3545')}</div><button type="button" class="sms-save-btn" style="width:100%; padding:5px 0; margin-top:5px; background:#28a745; color:white; border:none; border-radius:3px; cursor:pointer; font-size:0.85em; font-weight:bold; text-align:center;" onclick="window.registerParsedTripWithInfo(this, ${lineIdx})">저장</button>`;
        resultsDiv.appendChild(itemDiv);
    });
}
function handleSmsNameInput(input, addrId, memoId) { const val = input.value.trim(); const loc = MEM_LOCATIONS[val]; const addrInput = document.getElementById(addrId); const memoInput = document.getElementById(memoId); if (loc && addrInput && memoInput) { addrInput.value = loc.address || ''; memoInput.value = loc.memo || ''; addrInput.style.backgroundColor = '#f9f9f9'; } else if (addrInput) { addrInput.value = ''; if(memoInput) memoInput.value = ''; addrInput.style.backgroundColor = '#fff0f0'; } }
function registerParsedTripWithInfo(btn, lineIdx) {
    const fromName = document.getElementById(`from-${lineIdx}-name`).value.trim(); const toName = document.getElementById(`to-${lineIdx}-name`).value.trim(); const fromAddr = document.getElementById(`from-${lineIdx}-addr`)?.value.trim(); const fromMemo = document.getElementById(`from-${lineIdx}-memo`)?.value.trim(); const toAddr = document.getElementById(`to-${lineIdx}-addr`)?.value.trim(); const toMemo = document.getElementById(`to-${lineIdx}-memo`)?.value.trim();
    if (!fromName || !toName) { alert("상/하차지 이름을 입력해주세요."); return; } if (!fromAddr || !toAddr) { alert("주소 필수"); return; }
    if (fromAddr || fromMemo) updateLocationData(fromName, fromAddr, fromMemo); if (toAddr || toMemo) updateLocationData(toName, toAddr, toMemo); const key = `${fromName}-${toName}`;
    addRecord({ id: Date.now() + Math.floor(Math.random() * 1000), date: getTodayString(), time: "", type: "화물운송", from: fromName, to: toName, distance: MEM_DISTANCES[key] || 0, income: MEM_FARES[key] || 0, cost: 0, liters: 0, unitPrice: 0, brand: "", expenseItem: "", supplyItem: "", mileage: 0 });
    const card = btn.closest('.sms-item-card'); if (card) card.remove(); showToast(`${fromName} → ${toName} 등록됨`); if (window.updateAllDisplays) window.updateAllDisplays(); const smsSection = document.getElementById('sms-parser-section'); if(smsSection) { smsSection.classList.remove('hidden'); smsSection.style.display = 'block'; }
}
window.onManualSmsRead = function(body) { const smsInput = document.getElementById('sms-input'); if (smsInput) { smsInput.value = body; smsInput.style.height = '1px'; smsInput.style.height = (smsInput.scrollHeight) + 'px'; parseSmsText(); } };
async function performOCR(file) {
    const statusDiv = document.getElementById('ocr-status'); const resultContainer = document.getElementById('ocr-result-container'); if (!statusDiv || !resultContainer) return; statusDiv.textContent = "영수증 분석 중... (5~10초 소요)"; resultContainer.classList.add('hidden');
    try { const { data: { text } } = await Tesseract.recognize(file, 'kor', { logger: m => console.log(m) }); statusDiv.textContent = "분석 완료!"; resultContainer.innerHTML = `<div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; margin-bottom:10px;"><input type="date" id="ocr-date" style="padding:8px; border:1px solid #ddd; border-radius:4px;"><input type="time" id="ocr-time" style="padding:8px; border:1px solid #ddd; border-radius:4px;"><input type="number" id="ocr-cost" placeholder="주유금액" style="padding:8px; border:1px solid #ddd; border-radius:4px;"><input type="number" id="ocr-subsidy" placeholder="보조금액" style="padding:8px; border:1px solid #ddd; border-radius:4px;"><input type="number" id="ocr-liters" placeholder="주유리터" step="0.01" style="padding:8px; border:1px solid #ddd; border-radius:4px;"><input type="number" id="ocr-price" placeholder="주유단가" style="padding:8px; border:1px solid #ddd; border-radius:4px;"><input type="number" id="ocr-remaining" placeholder="잔여한도" step="0.01" style="padding:8px; border:1px solid #ddd; border-radius:4px;"><input type="number" id="ocr-net-cost" placeholder="실지출(자동)" readonly style="padding:8px; border:1px solid #ddd; border-radius:4px; background:#eee;"></div><div style="display:flex; gap:5px;"><button onclick="document.getElementById('ocr-result-container').classList.add('hidden')" style="flex:1; padding:10px; background:#6c757d; color:white; border:none; border-radius:4px;">초기화</button><button id="btn-save-ocr-final" style="flex:1; padding:10px; background:#28a745; color:white; border:none; border-radius:4px; font-weight:bold;">저장하기</button></div>`; document.getElementById('btn-save-ocr-final').addEventListener('click', saveOcrData); parseReceiptText(text); resultContainer.classList.remove('hidden'); } catch (error) { console.error(error); statusDiv.textContent = "이미지 분석 실패. 다시 시도해주세요."; }
}
function parseReceiptText(text) {
    const dateMatch = text.match(/(\d{4})[-.,/년\s]+(\d{1,2})[-.,/월\s]+(\d{1,2})/); if (dateMatch) { document.getElementById('ocr-date').value = `${dateMatch[1]}-${dateMatch[2].padStart(2,'0')}-${dateMatch[3].padStart(2,'0')}`; } else { document.getElementById('ocr-date').value = getTodayString(); }
    const timeMatch = text.match(/(\d{1,2})\s*:\s*(\d{2})/); if (timeMatch) { document.getElementById('ocr-time').value = `${timeMatch[1].padStart(2,'0')}:${timeMatch[2]}`; } else { document.getElementById('ocr-time').value = getCurrentTimeString(); }
    const lines = text.split('\n');
    for (let line of lines) {
        const lineClean = line.replace(/\s/g, ''); const extractNum = (str) => { const matches = str.match(/[\d,.]+/g); if (!matches) return null; let lastVal = matches[matches.length - 1]; if(lastVal.endsWith('.')) lastVal = lastVal.slice(0, -1); return parseFloat(lastVal.replace(/,/g, '')); };
        if (lineClean.includes('주유금액') || lineClean.includes('승인금액') || lineClean.includes('합계')) { const val = extractNum(line); if (val && val > 1000) document.getElementById('ocr-cost').value = val; }
        if (lineClean.includes('주유리터') || lineClean.includes('주유량') || lineClean.includes('판매량')) { const val = extractNum(line); if (val) document.getElementById('ocr-liters').value = val; }
        if (lineClean.includes('주유단가') || lineClean.includes('단가')) { const val = extractNum(line); if (val && val > 500 && val < 3000) document.getElementById('ocr-price').value = val; }
        if (lineClean.includes('보조금액') || lineClean.includes('화물복지') || lineClean.includes('보조금')) { const val = extractNum(line); if (val) document.getElementById('ocr-subsidy').value = val; }
        if (lineClean.includes('잔여한도') || lineClean.includes('잔여량')) { const val = extractNum(line); if (val) document.getElementById('ocr-remaining').value = val; }
    }
    const lit = parseFloat(document.getElementById('ocr-liters').value) || 0; const price = parseInt(document.getElementById('ocr-price').value) || 0; let cost = parseInt(document.getElementById('ocr-cost').value) || 0;
    if (cost === 0 && lit > 0 && price > 0) { cost = Math.round(lit * price); document.getElementById('ocr-cost').value = cost; }
    const subsidy = parseInt(document.getElementById('ocr-subsidy').value) || 0; if (cost > 0) { document.getElementById('ocr-net-cost').value = cost - subsidy; }
}
function saveOcrData() {
    const cost = safeInt(document.getElementById('ocr-cost').value); if(cost <= 0) { alert('금액을 확인해주세요.'); return; }
    addRecord({ id: Date.now(), date: document.getElementById('ocr-date').value, time: document.getElementById('ocr-time').value, type: '주유소', cost: cost, liters: safeFloat(document.getElementById('ocr-liters').value), unitPrice: safeInt(document.getElementById('ocr-price').value), brand: '기타', subsidy: safeInt(document.getElementById('ocr-subsidy').value) });
    showToast("주유 기록 저장됨"); document.getElementById('ocr-result-container').classList.add('hidden'); displaySubsidyRecords();
}

function calculateTotalDuration(records) {
    const sorted = [...records].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)); let totalMinutes = 0; if (sorted.length < 2) return '0h 0m';
    for (let i = 1; i < sorted.length; i++) { const curr = new Date(`${sorted[i].date}T${sorted[i].time}`); const prev = new Date(`${sorted[i-1].date}T${sorted[i-1].time}`); if (sorted[i-1].type !== '운행종료') totalMinutes += (curr - prev) / 60000; }
    const hours = Math.floor(totalMinutes / 60); const minutes = Math.round(totalMinutes % 60); return `${hours}h ${minutes}m`;
}
function createSummaryHTML(title, records) {
    let totalIncome = 0, totalExpense = 0, totalDistance = 0, totalTripCount = 0; let totalFuelCost = 0, totalFuelLiters = 0, totalEmptyDist = 0;
    records.forEach(r => { if(r.type!=='운행종료' && r.type!=='운행취소') { totalIncome += safeInt(r.income); totalExpense += safeInt(r.cost); } if (r.type === '주유소') { totalFuelCost += safeInt(r.cost); totalFuelLiters += safeFloat(r.liters); } if (['화물운송'].includes(r.type)) { totalDistance += safeFloat(r.distance); totalTripCount++; } if (r.type === '공차이동') { totalEmptyDist += safeFloat(r.distance); } });
    const netIncome = totalIncome - totalExpense; const items = [ { label: '수입', value: formatToManwon(totalIncome) + ' 만원', className: 'income' }, { label: '지출', value: formatToManwon(totalExpense) + ' 만원', className: 'cost' }, { label: '정산', value: formatToManwon(netIncome) + ' 만원', className: 'net' }, { label: '운행거리', value: totalDistance.toFixed(1) + ' km', className: '' }, { label: '운행건수', value: totalTripCount + ' 건', className: '' }, { label: '주유금액', value: formatToManwon(totalFuelCost) + ' 만원', className: 'cost' }, { label: '주유리터', value: totalFuelLiters.toFixed(2) + ' L', className: '' }, { label: '공차거리', value: totalEmptyDist.toFixed(1) + ' km', className: 'note' } ];
    let html = `<strong>${title}</strong><div class="summary-toggle-grid" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:5px; margin-top:5px;">`; items.forEach(item => { html += `<div class="summary-item" style="border:1px solid #ddd; padding:5px; text-align:center; border-radius:5px;"><span class="summary-label" style="display:block; font-size:0.8em; color:#666;">${item.label}</span><span class="summary-value ${item.className || ''}" style="font-weight:bold; font-size:0.9em;">${item.value}</span></div>`; }); html += `</div>`; return html;
}

function displayTodayRecords(date) {
    const todayTable = document.getElementById('today-records-table'); const oldTbody = todayTable.querySelector('tbody'); if(oldTbody) oldTbody.remove();
    const thead = todayTable.querySelector('thead'); if(thead) thead.style.display = 'none'; const tbody = document.createElement('tbody'); todayTable.appendChild(tbody);
    const dayRecords = MEM_RECORDS.filter(r => getStatisticalDate(r.date, r.time) === date);
    const sortedAll = [...MEM_RECORDS].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    const registeredList = [], ongoingList = [], completedList = [], otherList = [];
    const displayList = dayRecords.filter(r => r.type !== '운행종료');

    displayList.forEach(r => {
        if (['화물운송','대기','운행취소','공차이동'].includes(r.type)) {
            if (!r.time || r.time === '') { registeredList.push(r); return; }
            let isCompleted = false; const idx = sortedAll.findIndex(item => item.id === r.id);
            if (idx > -1 && idx < sortedAll.length - 1) { const next = sortedAll[idx + 1]; if(next.type !== '운행취소') isCompleted = true; }
            if(r.type === '운행취소') isCompleted = true;
            if(isCompleted) completedList.push(r); else ongoingList.push(r);
        } else { otherList.push(r); }
    });
    
    // 순서 정렬: 진행중(상단) -> 기타 -> 완료 -> 등록(하단)
    registeredList.sort((a, b) => b.id - a.id); ongoingList.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    completedList.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)); otherList.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

    const createRow = (r, isHidden = false) => {
        const tr = document.createElement('tr'); tr.dataset.id = r.id; if(isHidden) tr.classList.add('completed-row', 'hidden');
        tr.onclick = (e) => { if(!e.target.classList.contains('location-clickable')) { editRecord(r.id); } };
        let timeDisplay = r.time || '<span style="color:#aaa;">(대기)</span>'; if(r.time && r.date !== date) timeDisplay = `<span style="font-size:0.8em; color:#888;">(익일)</span> ${r.time}`;
        let endTime = '', duration = '';
        if (r.time) { const idx = sortedAll.findIndex(item => item.id === r.id); if (idx > -1 && idx < sortedAll.length - 1) { const next = sortedAll[idx + 1]; if(next.type !== '운행취소') { endTime = (next.date !== r.date) ? `(${next.date.substring(5)}) ${next.time}` : next.time; const diff = new Date(`${next.date}T${next.time}`) - new Date(`${r.date}T${r.time}`); if (diff >= 0) duration = `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`; } } if(r.type === '운행취소') endTime = '취소'; else if(!endTime) endTime = '진행중'; } else { endTime = '-'; }
        let money = ''; const inc = safeInt(r.income); const cst = safeInt(r.cost); if(inc > 0) money += `<span style="font-weight:bold; color:blue;">+${formatToManwon(inc)}</span> `; if(cst > 0) money += `<span style="font-weight:bold; color:red;">-${formatToManwon(cst)}</span>`;
        const fromLoc = MEM_LOCATIONS[r.from] || {}; const toLoc = MEM_LOCATIONS[r.to] || {}; const fromMemoHtml = fromLoc.memo ? `<div style="color:#555; font-size:0.9em; margin-top:2px;">${fromLoc.memo}</div>` : ''; const toMemoHtml = toLoc.memo ? `<div style="color:#555; font-size:0.9em; margin-top:2px;">${toLoc.memo}</div>` : '';
        let distInfo = r.distance ? `${safeFloat(r.distance)}km` : ''; if(r.type === '공차이동') { tr.style.background = '#fff3cd'; distInfo = `<span style="color:#856404; font-weight:bold;">[공차]</span> ` + distInfo; }
        tr.innerHTML = `<td colspan="7" style="padding:15px 10px; border-bottom:1px solid #ddd;"><div style="margin-bottom: 8px;"><div class="location-clickable" data-center="${r.from||''}" style="font-size:1.3em; font-weight:bold; color:#007bff; cursor:pointer; line-height:1.2;">${r.from||'-'}</div>${fromMemoHtml}</div><div style="font-size:1.0em; color:#ccc; margin-bottom: 8px; line-height:1;">➜ </div><div style="margin-bottom: 12px;"><div class="location-clickable" data-center="${r.to||''}" style="font-size:1.3em; font-weight:bold; color:#28a745; cursor:pointer; line-height:1.2;">${r.to||'-'}</div>${toMemoHtml}</div><div style="border-top:1px solid #eee; padding-top:8px; display:flex; justify-content:space-between; align-items:flex-end; font-size:0.95em; color:#444;"><div><span style="font-weight:bold;">${timeDisplay}</span> <span style="color:#888;">~ ${endTime}</span> ${duration ? `<span style="font-size:0.85em; color:#666;">(${duration})</span>` : ''}</div><div style="text-align:right;"><span style="margin-right:8px; font-weight:bold; color:#555;">${distInfo}</span>${money}</div></div></td>`;
        return tr;
    };

    if (ongoingList.length > 0) { const headerTr = document.createElement('tr'); headerTr.innerHTML = `<td colspan="7" style="background:#e8f5e9; font-weight:bold; padding:8px; color:#1b5e20;">🚚 진행 중</td>`; tbody.appendChild(headerTr); ongoingList.forEach(r => tbody.appendChild(createRow(r))); }
    otherList.forEach(r => { const tr = document.createElement('tr'); tr.dataset.id = r.id; tr.onclick = () => editRecord(r.id); const money = r.cost ? `-${formatToManwon(r.cost)}` : (r.income ? `+${formatToManwon(r.income)}` : ''); tr.innerHTML = `<td colspan="7" style="padding:10px; border-bottom:1px solid #ddd; color:#555;">[${r.type}] ${r.expenseItem || r.supplyItem || r.brand || ''} ${r.memo ? '('+r.memo+')' : ''} <span style="float:right; font-weight:bold;">${money}</span><div style="font-size:0.85em; color:#888;">${r.time}</div></td>`; tbody.appendChild(tr); });
    if(completedList.length > 0) { const toggleTr = document.createElement('tr'); toggleTr.innerHTML = `<td colspan="7" style="padding:0; border:none;"><button type="button" onclick="document.querySelectorAll('.completed-row').forEach(el => el.classList.toggle('hidden')); this.textContent = this.textContent.includes('보기') ? '▲ 완료된 운행 접기' : '▼ 완료된 운행 보기 (${completedList.length})';" style="width:100%; padding:12px; background:#f8f9fa; border:none; border-bottom:1px solid #ddd; color:#495057; font-weight:bold; cursor:pointer; text-align:left; font-size:1em;">▼ 완료된 운행 보기 (${completedList.length})</button></td>`; tbody.appendChild(toggleTr); completedList.forEach(r => tbody.appendChild(createRow(r, true))); }
    if (registeredList.length > 0) { const headerTr = document.createElement('tr'); headerTr.innerHTML = `<td colspan="7" style="background:#e3f2fd; font-weight:bold; padding:8px; color:#0d47a1;">📋 운행 등록 (대기중)</td>`; tbody.appendChild(headerTr); registeredList.forEach(r => tbody.appendChild(createRow(r))); }
    const todaySummaryDiv = document.getElementById('today-summary'); if(todaySummaryDiv) todaySummaryDiv.innerHTML = createSummaryHTML('오늘의 기록', dayRecords);
}

function displayDailyRecords() {
    const yearSelect = document.getElementById('daily-year-select'), monthSelect = document.getElementById('daily-month-select'); if(!yearSelect || !monthSelect) return;
    const year = yearSelect.value, month = monthSelect.value, selectedPeriod = `${year}-${month}`;
    const dailyTbody = document.querySelector('#daily-summary-table tbody'), dailySummaryDiv = document.getElementById('daily-summary');
    const monthRecords = MEM_RECORDS.filter(r => getStatisticalDate(r.date, r.time).startsWith(selectedPeriod));
    if(dailyTbody) dailyTbody.innerHTML = ''; if(dailySummaryDiv) dailySummaryDiv.innerHTML = "";
    
    const recordsByDate = {};
    monthRecords.forEach(r => { const statDate = getStatisticalDate(r.date, r.time); if(!recordsByDate[statDate]) recordsByDate[statDate] = { records: [], income: 0, expense: 0, fuel: 0, distance: 0, tripCount: 0 }; recordsByDate[statDate].records.push(r); });
    MEM_FIXED_EXPENSES.forEach(fe => {
        const targetDate = `${year}-${month}-${String(fe.day).padStart(2,'0')}`; const targetMonthNum = parseInt(month);
        if (fe.month !== 0 && fe.month !== targetMonthNum) return;
        if(new Date(targetDate).getDate() === fe.day) { if(!recordsByDate[targetDate]) recordsByDate[targetDate] = { records: [], income: 0, expense: 0, fuel: 0, distance: 0, tripCount: 0 }; recordsByDate[targetDate].expense += fe.cost; }
    });
    Object.keys(recordsByDate).sort().reverse().forEach(date => {
        const dayData = recordsByDate[date]; let inc = 0, exp = dayData.expense, fuel = 0, dist = 0, count = 0;
        dayData.records.forEach(r => { if(r.type === '주유소') fuel += safeInt(r.cost); else if (r.type !== '운행종료' && r.type !== '운행취소') { inc += safeInt(r.income); exp += safeInt(r.cost); } if(r.type === '화물운송') { dist += safeFloat(r.distance); count++; } });
        const tr = document.createElement('tr'); if(date === getTodayString()) tr.style.fontWeight = 'bold';
        tr.innerHTML = `<td data-label="일">${parseInt(date.substring(8,10))}일</td><td data-label="수입"><span class="income">${formatToManwon(inc)}</span></td><td data-label="지출"><span class="cost">${formatToManwon(exp)}</span></td><td data-label="주유"><span class="cost">${formatToManwon(fuel)}</span></td><td data-label="정산"><strong>${formatToManwon(inc-exp-fuel)}</strong></td><td data-label="거리">${dist.toFixed(1)}</td><td data-label="이동">${count}</td><td data-label="소요">${calculateTotalDuration(dayData.records.filter(r => ['화물운송', '공차이동', '대기', '운행종료', '운행취소'].includes(r.type)))}</td><td data-label="관리"><button class="edit-btn" onclick="window.viewDateDetails('${date}')">상세</button></td>`;
        if(dailyTbody) dailyTbody.appendChild(tr);
    });
}

function displayWeeklyRecords() {
    const yearSelect = document.getElementById('weekly-year-select'), monthSelect = document.getElementById('weekly-month-select'); if(!yearSelect || !monthSelect) return;
    const year = yearSelect.value, month = monthSelect.value, selectedPeriod = `${year}-${month}`;
    const weeklyTbody = document.querySelector('#weekly-summary-table tbody'), weeklySummaryDiv = document.getElementById('weekly-summary');
    const monthRecords = MEM_RECORDS.filter(r => getStatisticalDate(r.date, r.time).startsWith(selectedPeriod));
    if(weeklyTbody) weeklyTbody.innerHTML = ''; if(weeklySummaryDiv) weeklySummaryDiv.innerHTML = "";
    const weeks = {}; monthRecords.forEach(r => { const statDate = getStatisticalDate(r.date, r.time), d = new Date(statDate); const w = Math.ceil((d.getDate() + (new Date(d.getFullYear(), d.getMonth(), 1).getDay())) / 7); if(!weeks[w]) weeks[w] = []; weeks[w].push(r); });
    Object.keys(weeks).forEach(w => { const data = weeks[w]; let inc = 0, exp = 0, fuel = 0, dist = 0, count = 0; data.forEach(r => { if(r.type === '주유소') fuel += safeInt(r.cost); else if(r.type!=='운행종료'&&r.type!=='운행취소'){ inc+=safeInt(r.income); exp+=safeInt(r.cost); } if(r.type==='화물운송'){dist+=safeFloat(r.distance);count++;} }); const dates = data.map(r => new Date(getStatisticalDate(r.date, r.time)).getDate()); const tr = document.createElement('tr'); tr.innerHTML = `<td data-label="주차">${w}주차</td><td data-label="기간">${Math.min(...dates)}일~${Math.max(...dates)}일</td><td data-label="수입">${formatToManwon(inc)}</td><td data-label="지출">${formatToManwon(exp)}</td><td data-label="주유">${formatToManwon(fuel)}</td><td data-label="정산">${formatToManwon(inc-exp-fuel)}</td><td data-label="거리">${dist.toFixed(1)}</td><td data-label="이동">${count}</td><td data-label="소요">${calculateTotalDuration(data.filter(r => ['화물운송', '공차이동', '대기', '운행종료', '운행취소'].includes(r.type)))}</td>`; if(weeklyTbody) weeklyTbody.appendChild(tr); });
}

function displayMonthlyRecords() {
    const yearSelect = document.getElementById('monthly-year-select'); if(!yearSelect) return;
    const year = yearSelect.value, monthlyTbody = document.querySelector('#monthly-summary-table tbody'), monthlyYearlySummaryDiv = document.getElementById('monthly-yearly-summary');
    const yearRecords = MEM_RECORDS.filter(r => getStatisticalDate(r.date, r.time).startsWith(year));
    let totalFixedExpense = 0; MEM_FIXED_EXPENSES.forEach(fe => { if(fe.month === 0) totalFixedExpense += (fe.cost * 12); else totalFixedExpense += fe.cost; });
    let totalYearSalary = 0; Object.keys(MEM_SALARIES).forEach(k => { if(k.startsWith(year)) totalYearSalary += (MEM_SALARIES[k] || 0); });
    let summaryHtml = createSummaryHTML(`${year}년`, yearRecords);
    if(totalYearSalary > 0) summaryHtml += `<div style="margin-top:5px; text-align:right; color:#007bff; font-weight:bold; font-size:0.9em;">➕ 연간 급여 합계: ${formatToManwon(totalYearSalary)} 만원</div>`;
    if(totalFixedExpense > 0) summaryHtml += `<div style="text-align:right; color:#dc3545; font-weight:bold; font-size:0.9em;">➖ 연간 고정 지출 (추정): 약 ${formatToManwon(totalFixedExpense)} 만원</div>`;
    if(monthlyYearlySummaryDiv) monthlyYearlySummaryDiv.innerHTML = summaryHtml;
    if(monthlyTbody) monthlyTbody.innerHTML = '';
    const months = {}; yearRecords.forEach(r => { const m = getStatisticalDate(r.date, r.time).substring(0,7); if(!months[m]) months[m]={records:[]}; months[m].records.push(r); });
    Object.keys(months).sort().reverse().forEach(m => {
        const data = months[m]; let inc=0,exp=0,fuel=0,dist=0,count=0;
        data.records.forEach(r => { if(r.type === '주유소') fuel += safeInt(r.cost); else if(r.type!=='운행종료'&&r.type!=='운행취소'){ inc+=safeInt(r.income); exp+=safeInt(r.cost); } if(r.type==='화물운송'){dist+=safeFloat(r.distance);count++;} });
        let fixedMonthly = 0; const currentMonthNum = parseInt(m.substring(5));
        MEM_FIXED_EXPENSES.forEach(fe => { if (fe.month === 0 || fe.month === currentMonthNum) { fixedMonthly += fe.cost; } });
        exp += fixedMonthly; const monthlySalary = MEM_SALARIES[m] || 0; inc += monthlySalary;
        const salaryTag = monthlySalary > 0 ? `<br><span style="font-size:0.8em; color:blue;">(급여포함)</span>` : ''; const fixedTag = fixedMonthly > 0 ? `<br><span style="font-size:0.8em; color:red;">(고정지출)</span>` : '';
        const tr = document.createElement('tr'); tr.innerHTML = `<td data-label="월">${parseInt(m.substring(5))}월</td><td data-label="수입">${formatToManwon(inc)}${salaryTag}</td><td data-label="지출">${formatToManwon(exp)}${fixedTag}</td><td data-label="주유">${formatToManwon(fuel)}</td><td data-label="정산">${formatToManwon(inc-exp-fuel)}</td><td data-label="거리">${dist.toFixed(1)}</td><td data-label="이동">${count}</td><td data-label="소요">${calculateTotalDuration(data.records.filter(r => ['화물운송', '공차이동', '대기', '운행종료', '운행취소'].includes(r.type)))}</td>`;
        if(monthlyTbody) monthlyTbody.appendChild(tr);
    });
}

function displayCurrentMonthData() {
    let checkDate = new Date(); if(checkDate.getHours() < 4) checkDate.setDate(checkDate.getDate() - 1);
    const currentPeriod = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`;
    const monthRecords = MEM_RECORDS.filter(r => getStatisticalDate(r.date, r.time).startsWith(currentPeriod) && r.type !== '운행취소' && r.type !== '운행종료'); 
    let inc = 0, exp = 0, count = 0, dist = 0, liters = 0; 
    monthRecords.forEach(r => { inc += safeInt(r.income); exp += safeInt(r.cost); if(r.type === '화물운송') { count++; dist += safeFloat(r.distance); } if(r.type === '주유소') liters += safeFloat(r.liters); });
    const monthlySalary = MEM_SALARIES[currentPeriod] || 0; inc += monthlySalary;
    let fixedMonthly = 0; const currentMonthNum = parseInt(currentPeriod.split('-')[1]);
    MEM_FIXED_EXPENSES.forEach(fe => { if (fe.month === 0 || fe.month === currentMonthNum) { fixedMonthly += fe.cost; } });
    exp += fixedMonthly;
    const setTxt = (id, txt) => { const el = document.getElementById(id); if(el) el.textContent = txt; };
    setTxt('current-month-title', `${currentMonthNum}월 실시간 요약`); setTxt('current-month-operating-days', `${new Set(monthRecords.map(r => getStatisticalDate(r.date, r.time))).size} 일`); setTxt('current-month-trip-count', `${count} 건`); setTxt('current-month-total-mileage', `${dist.toFixed(1)} km`); setTxt('current-month-income', `${formatToManwon(inc)} 만원`); setTxt('current-month-expense', `${formatToManwon(exp)} 만원`); setTxt('current-month-net-income', `${formatToManwon(inc-exp)} 만원`); setTxt('current-month-avg-economy', `${liters > 0 && dist > 0 ? (dist/liters).toFixed(2) : 0} km/L`); setTxt('current-month-cost-per-km', `${dist > 0 ? Math.round(exp/dist).toLocaleString() : 0} 원`); 
    const limit = 2700; const pct = limit > 0 ? Math.min(100, 100 * liters / limit).toFixed(1) : 0; 
    const subSum = document.getElementById('subsidy-summary'); if(subSum) subSum.innerHTML = `<div class="progress-label">월 한도: ${limit.toLocaleString()} L | 사용: ${liters.toFixed(1)} L | 잔여: ${(limit-liters).toFixed(1)} L</div><div class="progress-bar-container"><div class="progress-bar progress-bar-used" style="width: ${pct}%;"></div></div>`; 
}
function displayCumulativeData() {
    const records = MEM_RECORDS.filter(r => r.type !== '운행취소' && r.type !== '운행종료'); let inc = 0, exp = 0, count = 0, dist = 0, liters = 0;
    records.forEach(r => { inc += safeInt(r.income); exp += safeInt(r.cost); if(r.type === '주유소') liters += safeFloat(r.liters); if(r.type === '화물운송') { count++; dist += safeFloat(r.distance); } });
    Object.values(MEM_SALARIES).forEach(amt => inc += amt); const totalDist = dist + (parseFloat(localStorage.getItem("mileage_correction")) || 0);
    const setTxt = (id, txt) => { const el = document.getElementById(id); if(el) el.textContent = txt; };
    setTxt('cumulative-operating-days', `${new Set(records.map(r => getStatisticalDate(r.date, r.time))).size} 일`); setTxt('cumulative-trip-count', `${count} 건`); setTxt('cumulative-total-mileage', `${Math.round(totalDist).toLocaleString()} km`); setTxt('cumulative-income', `${formatToManwon(inc)} 만원`); setTxt('cumulative-expense', `${formatToManwon(exp)} 만원`); setTxt('cumulative-net-income', `${formatToManwon(inc-exp)} 만원`); setTxt('cumulative-avg-economy', `${liters > 0 && totalDist > 0 ? (totalDist/liters).toFixed(2) : 0} km/L`); setTxt('cumulative-cost-per-km', `${totalDist > 0 ? Math.round(exp/totalDist).toLocaleString() : 0} 원`);
    renderMileageSummary();
}
function renderMileageSummary(period = 'monthly') {
    const validRecords = MEM_RECORDS.filter(r => ['화물운송'].includes(r.type)); let summaryData = {};
    if (period === 'monthly') { for (let i = 11; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); summaryData[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0; } validRecords.forEach(r => { const k = getStatisticalDate(r.date, r.time).substring(0, 7); if (summaryData.hasOwnProperty(k)) summaryData[k]++; }); }
    let h = ''; for (const k in summaryData) h += `<div class="metric-card"><span class="metric-label">${k}</span><span class="metric-value">${summaryData[k]} 건</span></div>`;
    if(document.getElementById('mileage-summary-cards')) document.getElementById('mileage-summary-cards').innerHTML = h;
}
function generatePrintView(year, month, period, isDetailed) {
    window.lastPrintParams = { year, month, period, isDetailed };
    const sDay = period === 'second' ? 16 : 1; const eDay = period === 'first' ? 15 : 31; const periodStr = period === 'full' ? '1일 ~ 말일' : `${sDay}일 ~ ${eDay === 15 ? 15 : '말일'}일`;
    const salaryKey = `${year}-${month}`; const monthlySalary = MEM_SALARIES[salaryKey] || 0;
    const transportList = [], fuelList = [], expenseList = [], incomeList = [];    
    let totalDist = 0, totalCount = 0, sumIncomeTrans = 0, sumIncomeOther = 0, sumExpTrans = 0, sumExpGen = 0, sumFuelCost = 0, sumFuelSub = 0, sumFuelLiters = 0; const workDays = new Set();
    MEM_RECORDS.forEach(r => {
        const statDate = getStatisticalDate(r.date, r.time); if (!statDate.startsWith(`${year}-${month}`)) return;
        const day = parseInt(statDate.split('-')[2]); if (day < sDay || day > eDay) return;
        if (r.type === '운행종료' || r.type === '운행취소') return;
        workDays.add(statDate); r._statDate = statDate; const cost = safeInt(r.cost); const income = safeInt(r.income);
        if (['화물운송', '대기', '공차이동'].includes(r.type)) { transportList.push(r); if (r.type === '화물운송') { totalDist += safeFloat(r.distance); totalCount++; } sumIncomeTrans += income; sumExpTrans += cost; } 
        else if (r.type === '주유소') { fuelList.push(r); sumFuelCost += cost; sumFuelLiters += safeFloat(r.liters); sumFuelSub += safeInt(r.subsidy); } 
        else if (['지출', '소모품', '정비'].includes(r.type)) { expenseList.push(r); sumExpGen += cost; } else if (r.type === '수입') { incomeList.push(r); sumIncomeOther += income; }
    });
    if (monthlySalary > 0) { incomeList.push({ date: `${year}-${month}-01`, _statDate: `${year}-${month}-01`, time: '00:00', type: '급여', expenseItem: '고정 급여', income: monthlySalary }); sumIncomeOther += monthlySalary; }
    const targetMonthNum = parseInt(month);
    MEM_FIXED_EXPENSES.forEach(fe => {
        if (fe.month !== 0 && fe.month !== targetMonthNum) return;
        if (fe.day >= sDay && fe.day <= eDay) { const dateStr = `${year}-${month}-${String(fe.day).padStart(2,'0')}`; if (new Date(dateStr).getDate() === fe.day) { const prefix = (fe.month && fe.month > 0) ? `[${fe.month}월 고정] ` : `[매월 고정] `; expenseList.push({ date: dateStr, _statDate: dateStr, time: '00:00', type: '고정지출', expenseItem: prefix + fe.name, memo: fe.memo, cost: fe.cost }); sumExpGen += fe.cost; } }
    });
    const sortFn = (a, b) => (a.date + a.time).localeCompare(b.date + b.time); transportList.sort(sortFn); fuelList.sort(sortFn); expenseList.sort(sortFn); incomeList.sort(sortFn);
    const totalIncome = sumIncomeTrans + sumIncomeOther; const totalExpense = sumExpTrans + sumExpGen; const netFuelCost = sumFuelCost - sumFuelSub; const finalProfit = totalIncome - totalExpense - netFuelCost; const formatMoney = (n) => n.toLocaleString();
    let reportContent = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>운송 기록 [${year}-${month}]</title><style>body { font-family: 'Malgun Gothic', sans-serif; padding: 20px; color: #333; background: #fff; }h2 { text-align: left; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; font-size: 1.5em; }.summary-box { background: #f9f9f9; padding: 15px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 30px; font-size: 0.95em; line-height: 1.8; }.summary-row { margin-bottom: 5px; }.val-bold { font-weight: bold; }.section-title { font-size: 1.1em; font-weight: bold; margin: 20px 0 10px 0; border-left: 5px solid #333; padding-left: 10px; }table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }th { background: #eee; border: 1px solid #ccc; padding: 8px; font-weight: bold; text-align: center; }td { border-left: 1px solid #ccc; border-right: 1px solid #ccc; padding: 6px 8px; vertical-align: middle; }tr.new-day td { border-top: 2px solid #444 !important; } tr:not(.new-day) td { border-top: 1px solid #eee; }.txt-right { text-align: right; }.txt-center { text-align: center; }.txt-red { color: #dc3545; }.txt-blue { color: #007bff; }.no-record { text-align: center; padding: 20px; color: #999; border-bottom: 1px solid #ccc; }input.money-input { width: 60px; text-align: right; border: none; border-bottom: 1px solid #ccc; font-family: inherit; font-size: inherit; background: transparent; }@media print { input { border: none !important; border-bottom: none !important; } }</style></head><body><h2>${year}년 ${month}월 ${periodStr} 운송 기록</h2><div class="summary-box"><div class="summary-row"><strong>[요약]</strong> 근무일: ${workDays.size}일 | 운행건수: ${totalCount}건 | 운행거리: ${totalDist.toFixed(1)}km</div><div class="summary-row" style="margin-top:10px; border-top:1px dashed #ccc; padding-top:10px;">총 수입: <span class="val-bold plus">${formatMoney(totalIncome)} 원</span> <span style="color:#666; font-size:0.9em;">(운송: ${formatMoney(sumIncomeTrans)} + 기타/급여: ${formatMoney(sumIncomeOther)})</span></div><div class="summary-row">총 지출: <span class="val-bold minus">${formatMoney(totalExpense)} 원</span> <span style="color:#666; font-size:0.9em;">(운송지출: ${formatMoney(sumExpTrans)} + 일반지출: ${formatMoney(sumExpGen)})</span></div><div class="summary-row">실 주유비: <span class="val-bold minus">${formatMoney(netFuelCost)} 원</span> <span style="color:#666; font-size:0.9em;">(주유금액: ${formatMoney(sumFuelCost)} - 보조금: ${formatMoney(sumFuelSub)})</span></div><div class="summary-row" style="margin-top:10px; border-top:1px solid #ccc; padding-top:10px; font-size:1.1em;">최종 순수익: <span class="val-bold equal" style="font-size:1.2em;">${formatMoney(finalProfit)} 원</span></div></div>`;
    const buildTable = (title, headers, rows) => { let tHtml = `<div class="section-title">${title}</div><table><thead><tr>${headers.map(h=>`<th style="${h.style||''}">${h.text}</th>`).join('')}</tr></thead><tbody>`; if (rows.length === 0) tHtml += `<tr><td colspan="${headers.length}" class="no-record">내역 없음</td></tr>`; else { let lastDate = ''; rows.forEach(r => { const isNewDay = r._statDate !== lastDate; lastDate = r._statDate; tHtml += `<tr class="${isNewDay ? 'new-day' : ''}">${r.cells.map(c=>`<td class="${c.cls||''}">${c.val}</td>`).join('')}</tr>`; }); } tHtml += `</tbody></table>`; return tHtml; };
    reportContent += buildTable('1. 운송 내역', [ {text:'날짜', style:'width:10%'}, {text:'상차지', style:'width:20%'}, {text:'하차지', style:'width:20%'}, {text:'내용', style:'width:20%'}, {text:'거리', style:'width:10%'}, {text:'수입(만)', style:'width:10%'}, {text:'비고', style:'width:10%'} ], transportList.map(r => ({ _statDate: r._statDate, cells: [{val: r.date.substring(5), cls:'txt-center'}, {val: r.from || '-'}, {val: r.to || '-'}, {val: (r.type==='대기'?'대기':(r.type==='공차이동'?'공차이동':'화물운송')) + (isDetailed && r.expenseItem ? ` (${r.expenseItem})` : ''), cls:'txt-center'}, {val: r.distance ? r.distance+' km' : '-', cls:'txt-center'}, {val: `<input type="number" class="money-input" value="${r.income ? r.income / 10000 : 0}" step="0.1" onchange="window.updateIncomeFromPrint(this, ${r.id})">`, cls:'txt-right'}, {val: '', cls:'txt-center'} ] })));
    reportContent += buildTable('2. 주유 및 정비 내역', [ {text:'날짜'}, {text:'주유리터'}, {text:'주유단가'}, {text:'주유금액'}, {text:'보조금액'}, {text:'실결제금액'} ], fuelList.map(r => { const c=safeInt(r.cost), s=safeInt(r.subsidy); return { _statDate: r._statDate, cells: [{val: r.date.substring(5), cls:'txt-center'}, {val: r.liters?r.liters.toFixed(2)+' L':'-', cls:'txt-center'}, {val: r.unitPrice?formatMoney(r.unitPrice)+' 원':'-', cls:'txt-center'}, {val: formatMoney(c)+' 원', cls:'txt-right'}, {val: '-'+formatMoney(s)+' 원', cls:'txt-right txt-red'}, {val: formatMoney(c-s)+' 원', cls:'txt-right val-bold'}]}; }));
    reportContent += buildTable('3. 지출 내역', [ {text:'날짜', style:'width:15%'}, {text:'내용 (적요)'}, {text:'지출금액', style:'width:20%'} ], expenseList.map(r => { let content = r.expenseItem||r.supplyItem||r.type; if(r.memo && r.memo.trim()) content += ` <span style="color:#666; font-size:0.9em;">(${r.memo})</span>`; if(r.type === '고정지출') content = `<span style="color:#d63384; font-weight:bold;">${content}</span>`; return { _statDate: r._statDate, cells: [{val: r.date.substring(5), cls:'txt-center'}, {val: content}, {val: formatMoney(safeInt(r.cost))+' 원', cls:'txt-right'}]}; }));
    reportContent += buildTable('4. 수입 내역 (기타/급여)', [ {text:'날짜', style:'width:15%'}, {text:'내용'}, {text:'금액', style:'width:20%'} ], incomeList.map(r => ({ _statDate: r._statDate, cells: [{val: r.type === '급여' ? '-' : r.date.substring(5), cls:'txt-center'}, {val: r.expenseItem||'기타 수입'}, {val: formatMoney(safeInt(r.income))+' 원', cls:'txt-right txt-blue'}]})) );
    reportContent += `</body></html>`;
    const modalHtml = `<div style="padding:20px; font-family:sans-serif; background:white; min-height:100vh;"><div style="text-align:right; margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:10px;"><button id="btn-print-modal-close" style="padding:10px 20px; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer; margin-right:5px;">닫기 X</button><button id="btn-print-modal-export" style="padding:10px 20px; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">📄 파일 저장</button></div><div id="print-content-area" style="border:1px solid #ccc; padding:20px; box-shadow:0 0 10px rgba(0,0,0,0.05);">${reportContent}</div></div>`;
    const oldModal = document.getElementById('print-modal'); if(oldModal) oldModal.remove(); let modal = document.createElement('div'); modal.id = 'print-modal'; modal.style.position = 'fixed'; modal.style.top = '0'; modal.style.left = '0'; modal.style.width = '100%'; modal.style.height = '100%'; modal.style.zIndex = '9999'; modal.style.overflow = 'auto'; modal.style.background = 'white'; modal.innerHTML = modalHtml; document.body.appendChild(modal);
    document.getElementById('btn-print-modal-close').onclick = function() { document.getElementById('print-modal').remove(); };
    document.getElementById('btn-print-modal-export').onclick = function() { const fileName = `CarGoNote_${year}-${month}_${periodStr.replace(/~/g,'-')}.html`; if(window.CargoNoteApp && window.CargoNoteApp.saveHtmlFile) { window.CargoNoteApp.saveHtmlFile(fileName, reportContent); showToast("저장 요청을 보냈습니다."); } else { const blob = new Blob([reportContent], { type: "text/html;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); showToast("브라우저 다운로드 시작"); } };
}

document.addEventListener("DOMContentLoaded", () => {
    loadAllData(); populateCenterDatalist(); populateExpenseDatalist();
    const smsReadBtn = document.getElementById('btn-read-sms'); if(smsReadBtn) smsReadBtn.style.display = 'none';
    document.querySelectorAll('.mobile-toggle-legend').forEach(legend => { legend.addEventListener('click', function() { const targetId = this.getAttribute('data-target'); const targetBody = document.getElementById(targetId); if (targetBody) { if(targetBody.style.display === 'block') { targetBody.style.display = 'none'; this.classList.remove('active'); } else { targetBody.style.display = 'block'; this.classList.add('active'); } } }); });
    const today = getTodayString(); if(document.getElementById('date')) document.getElementById('date').value = today; if(document.getElementById('today-date-picker')) document.getElementById('today-date-picker').value = today; if(document.getElementById('time')) document.getElementById('time').value = getCurrentTimeString();
    const currentYear = new Date().getFullYear();
    const yearOptions = []; for (let i = 0; i < 5; i++) { yearOptions.push(`<option value="${currentYear - i}">${currentYear - i}년</option>`); }
    const monthOptions = []; for (let i = 1; i <= 12; i++) { monthOptions.push(`<option value="${String(i).padStart(2,'0')}">${i}월</option>`); }
    ['daily','weekly','monthly','print'].forEach(p => { const y = document.getElementById(`${p}-year-select`); const m = document.getElementById(`${p}-month-select`); if(y) y.innerHTML = yearOptions.join(''); if(m) { m.innerHTML = monthOptions.join(''); m.value = String(new Date().getMonth()+1).padStart(2,'0'); } });

    // [변경] 운행취소 버튼 -> 운행삭제로 변경
    const cancelBtn = document.getElementById('btn-trip-cancel'); if(cancelBtn) cancelBtn.textContent = "운행삭제";

    window.updateIncomeFromPrint = function(inputEl, id) { const newVal = parseFloat(inputEl.value); if (isNaN(newVal)) return; const record = MEM_RECORDS.find(r => r.id === id); if (record) { record.income = Math.round(newVal * 10000); if(record.type === '화물운송' && record.from && record.to) { const key = `${record.from}-${record.to}`; MEM_FARES[key] = record.income; } saveData(); const p = window.lastPrintParams; if(p) { generatePrintView(p.year, p.month, p.period, p.isDetailed); setTimeout(() => showToast("저장 및 재계산 완료"), 100); } } };
    document.getElementById('print-first-half-btn')?.addEventListener('click', () => { generatePrintView(document.getElementById('print-year-select').value, document.getElementById('print-month-select').value, 'first', false); });
    document.getElementById('print-second-half-btn')?.addEventListener('click', () => { generatePrintView(document.getElementById('print-year-select').value, document.getElementById('print-month-select').value, 'second', false); });
    document.getElementById('print-full-month-btn')?.addEventListener('click', () => { generatePrintView(document.getElementById('print-year-select').value, document.getElementById('print-month-select').value, 'full', false); });
    document.getElementById('print-first-half-detail-btn')?.addEventListener('click', () => { generatePrintView(document.getElementById('print-year-select').value, document.getElementById('print-month-select').value, 'first', true); });
    document.getElementById('print-second-half-detail-btn')?.addEventListener('click', () => { generatePrintView(document.getElementById('print-year-select').value, document.getElementById('print-month-select').value, 'second', true); });
    document.getElementById('print-full-month-detail-btn')?.addEventListener('click', () => { generatePrintView(document.getElementById('print-year-select').value, document.getElementById('print-month-select').value, 'full', true); });

    function performExport(isAuto = false) { const data = { records: MEM_RECORDS, centers: MEM_CENTERS, locations: MEM_LOCATIONS, fares: MEM_FARES, distances: MEM_DISTANCES, costs: MEM_COSTS, subsidy: localStorage.getItem('fuel_subsidy_limit'), correction: localStorage.getItem('mileage_correction'), expenseItems: MEM_EXPENSE_ITEMS, salaries: MEM_SALARIES, fixedExpenses: MEM_FIXED_EXPENSES }; const jsonString = JSON.stringify(data, null, 2); if (window.CargoNoteApp && window.CargoNoteApp.saveBackupFile) { window.CargoNoteApp.saveBackupFile(jsonString); if(isAuto) showToast("📅 금일 최초 실행: 데이터 자동 백업 중..."); else showToast("백업 파일 저장 시도 중..."); return true; } else { if(isAuto) { try { const blob = new Blob([jsonString], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); a.href = url; a.download = `CargoNote_AutoBackup_${timestamp}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); showToast("📅 자동 백업 파일이 다운로드되었습니다."); return true; } catch(e) { return false; } } else { if(confirm("안드로이드 파일 저장이 지원되지 않는 환경입니다.\n데이터를 클립보드에 복사하시겠습니까?")) { copyTextToClipboard(jsonString, "데이터가 복사되었습니다."); } return false; } } }
    function checkAndAutoBackup() { const today = getTodayString(); const lastBackupDate = localStorage.getItem('last_auto_backup_date'); if (lastBackupDate !== today) { setTimeout(() => { const success = performExport(true); if (success) { localStorage.setItem('last_auto_backup_date', today); } }, 1500); } }

    document.getElementById('export-json-btn')?.addEventListener('click', () => { performExport(false); });
    checkAndAutoBackup();
    document.getElementById('import-json-btn')?.addEventListener('click', () => document.getElementById('import-file-input')?.click());
    document.getElementById('import-file-input')?.addEventListener('change', (e) => { if(!confirm('데이터를 복원하시겠습니까? (기존 데이터 덮어씀)')) return; const r = new FileReader(); r.onload = (evt) => { try { const d = JSON.parse(evt.target.result); if(d.records) localStorage.setItem('records', JSON.stringify(d.records)); if(d.centers) localStorage.setItem('logistics_centers', JSON.stringify(d.centers)); if(d.locations) localStorage.setItem('saved_locations', JSON.stringify(d.locations)); if(d.fares) localStorage.setItem('saved_fares', JSON.stringify(d.fares)); if(d.distances) localStorage.setItem('saved_distances', JSON.stringify(d.distances)); if(d.costs) localStorage.setItem('saved_costs', JSON.stringify(d.costs)); if(d.expenseItems) localStorage.setItem('saved_expense_items', JSON.stringify(d.expenseItems)); if(d.salaries) localStorage.setItem('saved_salaries', JSON.stringify(d.salaries)); if(d.fixedExpenses) localStorage.setItem('saved_fixed_expenses', JSON.stringify(d.fixedExpenses)); alert('복원 완료! 앱을 재시작합니다.'); location.reload(); } catch(err) { alert('파일 형식이 잘못되었습니다.'); } }; r.readAsText(e.target.files[0]); });
    
    document.getElementById('btn-delete-record')?.addEventListener('click', () => { const modal = document.getElementById('custom-confirm-modal'); if(modal) modal.classList.remove('hidden'); });
    document.getElementById('btn-modal-cancel')?.addEventListener('click', () => { document.getElementById('custom-confirm-modal').classList.add('hidden'); });
    document.getElementById('btn-modal-ok')?.addEventListener('click', () => { const id = parseInt(document.getElementById('edit-id').value); removeRecord(id); resetForm(); updateAllDisplays(); document.getElementById('custom-confirm-modal').classList.add('hidden'); showToast("삭제되었습니다."); });
    document.getElementById('clear-btn')?.addEventListener('click', () => { if(confirm('모든 데이터를 정말 삭제하시겠습니까?')) { localStorage.clear(); location.reload(); } });

    document.getElementById('btn-save-ocr')?.addEventListener('click', () => { const cost = safeInt(document.getElementById('ocr-cost').value); if(cost <= 0) { alert('금액 확인 필요'); return; } const container = document.getElementById('ocr-result-container'); const subsidy = container.dataset.subsidy ? parseInt(container.dataset.subsidy) : 0; const brand = container.dataset.brand || '기타'; addRecord({ id: Date.now(), date: document.getElementById('ocr-date').value, time: document.getElementById('ocr-time').value, type: '주유소', cost: cost, liters: safeFloat(document.getElementById('ocr-liters').value), unitPrice: safeInt(document.getElementById('ocr-price').value), brand: brand, subsidy: subsidy }); showToast('저장됨'); document.getElementById('ocr-result-container').classList.add('hidden'); displaySubsidyRecords(false); });
    document.getElementById('ocr-input')?.addEventListener('change', (e) => { if(e.target.files[0]) performOCR(e.target.files[0]); });
    document.getElementById('btn-register-trip')?.addEventListener('click', () => { const d = getFormDataWithoutTime(); if((d.type==='화물운송'||d.type==='대기') && (!d.from || !d.to)) return alert('상하차지 입력 필요'); addRecord({ id: Date.now(), date: document.getElementById('date').value, time: document.getElementById('time').value, ...d }); showToast('등록되었습니다.'); resetForm(); updateAllDisplays(); });

    // [변경] 운행 시작: 기존 데이터 업데이트 (등록->진행)
    document.getElementById('btn-start-trip')?.addEventListener('click', () => {
        const formData = getFormDataWithoutTime(); if ((formData.type === '화물운송' || formData.type === '대기') && (!formData.from || !formData.to)) { alert('상차지와 하차지를 모두 입력해주세요.'); return; }
        const editIdVal = document.getElementById('edit-id').value;
        if(editIdVal) { const id = parseInt(editIdVal); const index = MEM_RECORDS.findIndex(r => r.id === id); if(index > -1) { MEM_RECORDS[index] = { ...MEM_RECORDS[index], ...formData, date: getTodayString(), time: getCurrentTimeString() }; saveData(); showToast('운행이 시작되었습니다 (업데이트)'); } } 
        else { addRecord({ id: Date.now(), date: getTodayString(), time: getCurrentTimeString(), ...formData }); showToast('운행 시작됨'); }
        resetForm(); document.getElementById('today-date-picker').value = getStatisticalDate(getTodayString(), getCurrentTimeString()); updateAllDisplays();
    });

    document.getElementById('btn-end-trip')?.addEventListener('click', () => { addRecord({ id: Date.now(), date: getTodayString(), time: getCurrentTimeString(), type: '운행종료', distance: 0, cost: 0, income: 0 }); showToast('운행 종료됨'); resetForm(); updateAllDisplays(); if (window.CargoNoteApp && window.CargoNoteApp.startGPSLogging) window.CargoNoteApp.startGPSLogging(); });
    
    // [변경] 운행 삭제 로직
    document.getElementById('btn-trip-cancel')?.addEventListener('click', () => {
        const editIdVal = document.getElementById('edit-id').value;
        if(editIdVal) { if(confirm('정말 이 운행 기록을 삭제하시겠습니까?')) { removeRecord(parseInt(editIdVal)); showToast('삭제되었습니다.'); resetForm(); updateAllDisplays(); } } else { resetForm(); showToast('입력이 초기화되었습니다.'); }
    });

    document.getElementById('btn-save-general')?.addEventListener('click', () => { const formData = getFormDataWithoutTime(); if (formData.expenseItem) updateExpenseItemData(formData.expenseItem); addRecord({ id: Date.now(), date: document.getElementById('date').value, time: document.getElementById('time').value, ...formData }); showToast('저장되었습니다.'); populateExpenseDatalist(); resetForm(); updateAllDisplays(); if(formData.type === '주유소') displaySubsidyRecords(false); });
    document.getElementById('btn-update-record')?.addEventListener('click', () => { const id = parseInt(document.getElementById('edit-id').value); const index = MEM_RECORDS.findIndex(r => r.id === id); if (index > -1) { const original = MEM_RECORDS[index]; const formData = getFormDataWithoutTime(); const newDate = document.getElementById('date').value; const newTime = document.getElementById('time').value; if (formData.type === '화물운송' && formData.from && formData.to) { const key = `${formData.from}-${formData.to}`; if(formData.distance > 0) MEM_DISTANCES[key] = formData.distance; if(formData.income > 0) MEM_FARES[key] = formData.income; } MEM_RECORDS[index] = { ...original, ...formData, date: newDate, time: newTime }; saveData(); showToast('수정 완료'); resetForm(); updateAllDisplays(); } });
    document.getElementById('btn-cancel-edit')?.addEventListener('click', resetForm);
    document.getElementById('btn-edit-start-trip')?.addEventListener('click', () => { const id = parseInt(document.getElementById('edit-id').value); const index = MEM_RECORDS.findIndex(r => r.id === id); if (index > -1) { MEM_RECORDS[index].date = getTodayString(); MEM_RECORDS[index].time = getCurrentTimeString(); saveData(); resetForm(); updateAllDisplays(); } });
    document.getElementById('btn-edit-end-trip')?.addEventListener('click', () => { addRecord({ id: Date.now(), date: getTodayString(), time: getCurrentTimeString(), type: '운행종료', distance: 0, cost: 0, income: 0 }); resetForm(); updateAllDisplays(); });
    document.getElementById('refresh-btn')?.addEventListener('click', () => { resetForm(); location.reload(); });
    document.getElementById('today-date-picker')?.addEventListener('change', () => updateAllDisplays());
    document.getElementById('prev-day-btn')?.addEventListener('click', () => moveDate(-1, updateAllDisplays)); document.getElementById('next-day-btn')?.addEventListener('click', () => moveDate(1, updateAllDisplays));
    document.getElementById('prev-daily-btn')?.addEventListener('click', () => changeDateSelect('daily-year-select', 'daily-month-select', -1, updateAllDisplays)); document.getElementById('next-daily-btn')?.addEventListener('click', () => changeDateSelect('daily-year-select', 'daily-month-select', 1, updateAllDisplays));
    document.getElementById('prev-weekly-btn')?.addEventListener('click', () => changeDateSelect('weekly-year-select', 'weekly-month-select', -1, updateAllDisplays)); document.getElementById('next-weekly-btn')?.addEventListener('click', () => changeDateSelect('weekly-year-select', 'weekly-month-select', 1, updateAllDisplays));
    document.getElementById('prev-monthly-btn')?.addEventListener('click', () => { const yEl = document.getElementById('monthly-year-select'); if(yEl) { yEl.value = parseInt(yEl.value) - 1; updateAllDisplays(); } }); document.getElementById('next-monthly-btn')?.addEventListener('click', () => { const yEl = document.getElementById('monthly-year-select'); if(yEl) { yEl.value = parseInt(yEl.value) + 1; updateAllDisplays(); } });
    ['daily-year-select', 'daily-month-select', 'weekly-year-select', 'weekly-month-select', 'monthly-year-select'].forEach(id => { document.getElementById(id)?.addEventListener('change', updateAllDisplays); });
    document.querySelectorAll('.tab-btn').forEach(btn => { btn.addEventListener('click', (e) => { if(btn.parentElement.classList.contains('view-tabs')) { document.querySelectorAll('.view-tabs .tab-btn').forEach(b => b.classList.remove('active')); document.querySelectorAll('.view-content').forEach(c => c.classList.remove('active')); btn.classList.add('active'); document.getElementById(btn.dataset.view + '-view').classList.add('active'); updateAllDisplays(); } }); });
    document.getElementById('btn-parse-sms')?.addEventListener('click', parseSmsText); const smsInput = document.getElementById('sms-input'); if(smsInput) { smsInput.addEventListener('input', function() { this.style.height = '1px'; this.style.height = (this.scrollHeight)+'px'; }); }
    document.addEventListener('click', (e) => { const toggleHeader = e.target.closest('.collapsible-header'); if (toggleHeader) { toggleHeader.classList.toggle('active'); const body = toggleHeader.nextElementSibling; if(body) body.classList.toggle('hidden'); if(!body.classList.contains('hidden')) { if(toggleHeader.id === 'toggle-subsidy-management') displaySubsidyRecords(false); if(toggleHeader.id === 'toggle-center-management') displayCenterList(''); } } let addrTarget = null; if(e.target.classList.contains('location-clickable')) { addrTarget = e.target; } else { addrTarget = e.target.closest('.address-clickable'); } if (addrTarget) { let addr = addrTarget.dataset.address; const centerName = addrTarget.dataset.center || addrTarget.textContent.trim(); if(!addr && centerName && MEM_LOCATIONS[centerName]) { addr = MEM_LOCATIONS[centerName].address; } if (addr) copyTextToClipboard(addr, `[${centerName}] 주소 복사됨`); else showToast(`'${centerName}' 저장된 주소 없음`); } });
    const toggleSmsBtn = document.getElementById('toggle-sms-section-btn'); if (toggleSmsBtn) { toggleSmsBtn.addEventListener('click', () => window.toggleSection('sms-parser-section', toggleSmsBtn)); }
    const toggleBasicBtn = document.getElementById('toggle-basic-info-btn'); if(toggleBasicBtn) { toggleBasicBtn.addEventListener('click', () => window.toggleSection('basic-info-section', toggleBasicBtn)); }
    const toggleDateBtn = document.getElementById('toggle-date-btn'); if(toggleDateBtn) { toggleDateBtn.addEventListener('click', () => window.toggleSection('date-fieldset', toggleDateBtn)); }
    const toggleTypeBtn = document.getElementById('toggle-type-btn'); if(toggleTypeBtn) { toggleTypeBtn.addEventListener('click', () => window.toggleSection('type-fieldset', toggleTypeBtn)); }
    const toggleLocBtn = document.getElementById('toggle-location-section-btn'); if (toggleLocBtn) { toggleLocBtn.addEventListener('click', () => window.toggleSection('transport-details', toggleLocBtn)); }
    const toggleCostBtn = document.getElementById('toggle-cost-section-btn'); if (toggleCostBtn) { toggleCostBtn.addEventListener('click', () => window.toggleSection('cost-info-fieldset', toggleCostBtn)); }
    const toggleTodayBtn = document.getElementById('toggle-today-list-btn'); if (toggleTodayBtn) { toggleTodayBtn.addEventListener('click', () => window.toggleSection('today-records-table', toggleTodayBtn)); }
    const searchInput = document.getElementById('center-search-input'); if (searchInput) { searchInput.addEventListener('input', (e) => displayCenterList(e.target.value)); }
    const addCenterBtn = document.getElementById('btn-add-center') || document.querySelector('button[onclick*="addNewCenterFromInput"]'); if (addCenterBtn) { addCenterBtn.addEventListener('click', window.addNewCenterFromInput); } else { const settingsPage = document.getElementById('settings-page'); if(settingsPage) { const btns = settingsPage.querySelectorAll('button'); for(let i=0; i<btns.length; i++) { if(btns[i].textContent.includes('추가') || btns[i].textContent.includes('등록')) { btns[i].addEventListener('click', window.addNewCenterFromInput); break; } } } }
    const dataBody = document.getElementById('data-management-body'); if(dataBody && !document.getElementById('sms-target-number')) { let div = document.createElement('div'); div.className = "input-group"; div.style.marginBottom = "10px"; div.innerHTML = `<input type="tel" id="sms-target-number" placeholder="자동 입력할 발신번호 (예: 1544-0000)" value="${localStorage.getItem('target_sms_number') || ''}"><button type="button" id="save-sms-number-btn" style="background-color:#17a2b8;">번호 저장</button>`; dataBody.insertBefore(div, dataBody.firstChild); document.getElementById('save-sms-number-btn').addEventListener('click', () => { localStorage.setItem('target_sms_number', document.getElementById('sms-target-number').value.trim()); showToast("번호 저장됨"); displaySavedSmsNumber(); }); }
    document.getElementById('back-to-main-btn')?.addEventListener('click', window.closeSettings);
    window.onDistanceReceived = function(distanceKm) { if (!distanceKm || distanceKm <= 0) return; const floatDist = parseFloat(distanceKm).toFixed(1); if (confirm(`측정된 거리: ${floatDist}km\n[확인] = 운행거리에 입력 (화물운송)\n[취소] = 공차이동으로 저장`)) { const distInput = document.getElementById('manual-distance'); if (distInput) { distInput.value = floatDist; distInput.dispatchEvent(new Event('input')); } } else { if(confirm("공차 이동 기록으로 저장하시겠습니까?")) { addRecord({ id: Date.now(), date: getTodayString(), time: getCurrentTimeString(), type: '공차이동', distance: parseFloat(floatDist), cost: 0, income: 0, from: 'GPS 측정', to: '이동' }); showToast("공차이동 저장됨"); updateAllDisplays(); } } };
    updateAllDisplays(); resetForm(); 
});