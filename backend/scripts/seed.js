const { executeQuery } = require('../config/db');

async function seed() {
  await executeQuery('SELECT 1');

  // Seed dropdowns
  const dropdowns = [
    ['ministry', 'Ministry of Electronics & IT', 'MINISTRY_OF_ELECTRONICS_IT'],
    ['ministry', 'Ministry of Home Affairs', 'MINISTRY_OF_HOME_AFFAIRS'],
    ['ministry', 'Ministry of Finance', 'MINISTRY_OF_FINANCE'],
    ['ministry', 'Ministry of Defence', 'MINISTRY_OF_DEFENCE'],
    ['ministry', 'Ministry of Health', 'MINISTRY_OF_HEALTH'],
    ['department', 'Department of IT', 'DEPT_OF_IT'],
    ['department', 'Department of Records', 'DEPT_OF_RECORDS'],
    ['department', 'Department of Procurement', 'DEPT_OF_PROCUREMENT'],
    ['department', 'Department of Planning', 'DEPT_OF_PLANNING'],
    ['asset_category', 'Laptop', 'LAPTOP'],
    ['asset_category', 'Desktop', 'DESKTOP'],
    ['asset_category', 'Monitor', 'MONITOR'],
    ['asset_category', 'Printer', 'PRINTER'],
    ['asset_category', 'Phone', 'PHONE'],
    ['asset_category', 'Tablet', 'TABLET'],
    ['asset_category', 'Projector', 'PROJECTOR'],
    ['asset_category', 'UPS', 'UPS'],
    ['asset_category', 'Scanner', 'SCANNER'],
    ['asset_category', 'Mouse', 'MOUSE'],
    ['operating_system', 'Windows 11', 'WINDOWS_11'],
    ['operating_system', 'Windows 10', 'WINDOWS_10'],
    ['operating_system', 'macOS', 'MACOS'],
    ['operating_system', 'Linux', 'LINUX'],
    ['network_connection_type', 'Ethernet', 'ETHERNET'],
    ['network_connection_type', 'WiFi', 'WIFI'],
    ['network_connection_type', 'Both', 'BOTH'],
    ['asset_current_status', 'Available', 'AVAILABLE'],
    ['asset_current_status', 'Assigned', 'ASSIGNED'],
    ['asset_current_status', 'In Maintenance', 'IN_MAINTENANCE'],
    ['asset_current_status', 'Decommissioned', 'DECOMMISSIONED'],
    ['amc_warranty', 'Yes', 'YES'],
    ['amc_warranty', 'No', 'NO'],
    ['critical', 'Yes', 'YES'],
    ['critical', 'No', 'NO'],
    ['edr_installed', 'Yes', 'YES'],
    ['edr_installed', 'No', 'NO'],
    ['uem_installed', 'Yes', 'YES'],
    ['uem_installed', 'No', 'NO'],
    ['asset_user', 'Sarah Chen', 'SARAH_CHEN'],
    ['asset_user', 'M. Johnson', 'M_JOHNSON'],
    ['asset_user', 'R. Alvarez', 'R_ALVAREZ'],
    ['asset_user', 'Priya Sharma', 'PRIYA_SHARMA'],
    ['asset_user', 'Rajesh Kumar', 'RAJESH_KUMAR'],
    ['asset_user', 'Amit Patel', 'AMIT_PATEL'],
    ['division', 'Infrastructure', 'INFRASTRUCTURE'],
    ['division', 'Applications', 'APPLICATIONS'],
    ['division', 'Security', 'SECURITY'],
    ['division', 'Administration', 'ADMINISTRATION'],
    ['designation', 'Director', 'DIRECTOR'],
    ['designation', 'Deputy Director', 'DEPUTY_DIRECTOR'],
    ['designation', 'Under Secretary', 'UNDER_SECRETARY'],
    ['designation', 'Section Officer', 'SECTION_OFFICER'],
    ['designation', 'Assistant Director', 'ASSISTANT_DIRECTOR'],
    ['designation', 'Programmer Analyst', 'PROGRAMMER_ANALYST'],
    ['designation', 'Data Entry Operator', 'DATA_ENTRY_OPERATOR'],
  ];

  for (const [field, name, code] of dropdowns) {
    try {
      await executeQuery(
        'INSERT INTO lookup_values (lookup_type, name, code) VALUES ($1, $2, $3)',
        [field, name, code]
      );
    } catch (e) { /* ignore duplicates */ }
  }

  const ddCount = await executeQuery('SELECT COUNT(*) AS cnt FROM lookup_values');
  console.log('Dropdown values:', ddCount.rows[0]?.cnt);

  // Seed inventory
  const invCols = 'sr_no,ministry,department,mdo_location,division,asset_id,asset_category,other_asset_category,serial_number,block_name,floor,room,workstation,asset_description,make_brand_model,purchase_date,operating_system,other_operating_system,ip_address,mac_address,network_connection_type,edr_installed,reason_no_edr,uem_installed,reason_no_uem,asset_user,asset_custodian,asset_current_status,date_of_removal,installation_date,end_of_support_date,end_of_life_date,amc_warranty,amc_warranty_expiry_date,critical,remarks,designation,email,phone,custodian';
  const colList = invCols.split(',');

  const assets = [
    { sr_no:1, ministry:'Ministry of Electronics & IT', department:'Department of IT', mdo_location:'Indira Paryavaran Bhawan', division:'Infrastructure', asset_id:'ASM-001847', asset_category:'Laptop', other_asset_category:'', serial_number:'SN-LP-001847', block_name:'', floor:'', room:'', workstation:'', asset_description:'MacBook Pro 16 inch M3 Max', make_brand_model:'Apple MacBook Pro 16 M3 Max', purchase_date:'2025-03-15', operating_system:'macOS', other_operating_system:'', ip_address:'10.0.1.101', mac_address:'AA:BB:CC:DD:EE:01', network_connection_type:'Both', edr_installed:'Yes', reason_no_edr:'', uem_installed:'Yes', reason_no_uem:'', asset_user:'Sarah Chen', asset_custodian:'IT Help Desk', asset_current_status:'Assigned', date_of_removal:'', installation_date:'2025-03-20', end_of_support_date:'2028-03-15', end_of_life_date:'2030-03-15', amc_warranty:'Yes', amc_warranty_expiry_date:'2028-03-15', critical:'Yes', remarks:'', designation:'IT Professional', email:'sarah.chen@gov.in', phone:'9876543210', custodian:'IT Help Desk' },
    { sr_no:2, ministry:'Ministry of Home Affairs', department:'Department of Records', mdo_location:'Lodhi Road Complex', division:'Applications', asset_id:'ASM-001848', asset_category:'Monitor', other_asset_category:'', serial_number:'SN-MN-001848', block_name:'', floor:'', room:'', workstation:'', asset_description:'Dell UltraSharp 27 inch 4K', make_brand_model:'Dell U2723QE', purchase_date:'2025-01-10', operating_system:'', other_operating_system:'', ip_address:'10.0.2.50', mac_address:'AA:BB:CC:DD:EE:02', network_connection_type:'Ethernet', edr_installed:'N/A', reason_no_edr:'', uem_installed:'N/A', reason_no_uem:'', asset_user:'M. Johnson', asset_custodian:'IT Help Desk', asset_current_status:'Assigned', date_of_removal:'', installation_date:'2025-01-15', end_of_support_date:'', end_of_life_date:'2030-01-10', amc_warranty:'Yes', amc_warranty_expiry_date:'2030-01-10', critical:'No', remarks:'', designation:'IT Support', email:'m.johnson@gov.in', phone:'9876543211', custodian:'IT Help Desk' },
    { sr_no:3, ministry:'Ministry of Finance', department:'Department of Procurement', mdo_location:'Sanchar Bhawan', division:'Administration', asset_id:'ASM-001849', asset_category:'Printer', other_asset_category:'', serial_number:'SN-PR-001849', block_name:'', floor:'', room:'', workstation:'', asset_description:'HP LaserJet Pro M404dn', make_brand_model:'HP LaserJet Pro M404dn', purchase_date:'2024-06-20', operating_system:'', other_operating_system:'', ip_address:'10.0.3.22', mac_address:'AA:BB:CC:DD:EE:03', network_connection_type:'Ethernet', edr_installed:'N/A', reason_no_edr:'', uem_installed:'N/A', reason_no_uem:'', asset_user:'', asset_custodian:'IT Help Desk', asset_current_status:'In Maintenance', date_of_removal:'', installation_date:'', end_of_support_date:'', end_of_life_date:'', amc_warranty:'Yes', amc_warranty_expiry_date:'', critical:'No', remarks:'', designation:'', email:'', phone:'', custodian:'IT Help Desk' },
    { sr_no:4, ministry:'Ministry of Defence', department:'Department of IT', mdo_location:'Raksha Bhawan', division:'Security', asset_id:'ASM-001850', asset_category:'Phone', other_asset_category:'', serial_number:'SN-PH-001850', block_name:'', floor:'', room:'', workstation:'', asset_description:'iPhone 15 Pro', make_brand_model:'Apple iPhone 15 Pro', purchase_date:'2025-05-01', operating_system:'iOS 17', other_operating_system:'', ip_address:'', mac_address:'AA:BB:CC:DD:EE:04', network_connection_type:'WiFi', edr_installed:'Yes', reason_no_edr:'', uem_installed:'Yes', reason_no_uem:'', asset_user:'R. Alvarez', asset_custodian:'IT Help Desk', asset_current_status:'Assigned', date_of_removal:'', installation_date:'2025-05-05', end_of_support_date:'2028-05-01', end_of_life_date:'2030-05-01', amc_warranty:'Yes', amc_warranty_expiry_date:'2028-05-01', critical:'Yes', remarks:'', designation:'Security Officer', email:'r.alvarez@gov.in', phone:'9876543212', custodian:'IT Help Desk' },
    { sr_no:5, ministry:'Ministry of Health', department:'Department of IT', mdo_location:'Indraprastha Estate', division:'Applications', asset_id:'ASM-001851', asset_category:'Mouse', other_asset_category:'', serial_number:'SN-MX-001851', block_name:'', floor:'', room:'', workstation:'', asset_description:'Logitech MX Master 3S', make_brand_model:'Logitech MX Master 3S', purchase_date:'2025-07-10', operating_system:'', other_operating_system:'', ip_address:'', mac_address:'AA:BB:CC:DD:EE:05', network_connection_type:'', edr_installed:'N/A', reason_no_edr:'', uem_installed:'N/A', reason_no_uem:'', asset_user:'', asset_custodian:'IT Help Desk', asset_current_status:'Available', date_of_removal:'', installation_date:'2025-07-15', end_of_support_date:'', end_of_life_date:'', amc_warranty:'Yes', amc_warranty_expiry_date:'', critical:'No', remarks:'', designation:'', email:'', phone:'', custodian:'IT Help Desk' },
    { sr_no:6, ministry:'Ministry of Electronics & IT', department:'Department of IT', mdo_location:'Niwas Complex', division:'Infrastructure', asset_id:'ASM-001852', asset_category:'Desktop', other_asset_category:'', serial_number:'SN-DT-001852', block_name:'', floor:'', room:'', workstation:'', asset_description:'Dell OptiPlex 7010', make_brand_model:'Dell OptiPlex 7010', purchase_date:'2024-09-01', operating_system:'Windows 11', other_operating_system:'', ip_address:'10.0.1.202', mac_address:'AA:BB:CC:DD:EE:06', network_connection_type:'Ethernet', edr_installed:'Yes', reason_no_edr:'', uem_installed:'Yes', reason_no_uem:'', asset_user:'Priya Sharma', asset_custodian:'IT Help Desk', asset_current_status:'Assigned', date_of_removal:'', installation_date:'2024-09-05', end_of_support_date:'2027-09-01', end_of_life_date:'2029-09-01', amc_warranty:'Yes', amc_warranty_expiry_date:'2027-09-01', critical:'Yes', remarks:'', designation:'IT Professional', email:'priya.sharma@gov.in', phone:'9876543213', custodian:'IT Help Desk' },
    { sr_no:7, ministry:'Ministry of Home Affairs', department:'Department of Planning', mdo_location:'Swatantra Bhawan', division:'Administration', asset_id:'ASM-001853', asset_category:'Projector', other_asset_category:'', serial_number:'SN-PJ-001853', block_name:'', floor:'', room:'', workstation:'', asset_description:'Epson PowerLite 2250U', make_brand_model:'Epson PowerLite 2250U', purchase_date:'2024-04-15', operating_system:'', other_operating_system:'', ip_address:'10.0.4.15', mac_address:'AA:BB:CC:DD:EE:07', network_connection_type:'Ethernet', edr_installed:'N/A', reason_no_edr:'', uem_installed:'N/A', reason_no_uem:'', asset_user:'', asset_custodian:'IT Help Desk', asset_current_status:'Available', date_of_removal:'', installation_date:'', end_of_support_date:'', end_of_life_date:'', amc_warranty:'No', amc_warranty_expiry_date:'', critical:'No', remarks:'', designation:'', email:'', phone:'', custodian:'IT Help Desk' },
    { sr_no:8, ministry:'Ministry of Finance', department:'Department of IT', mdo_location:'Kelkar Bhawan', division:'Applications', asset_id:'ASM-001854', asset_category:'Laptop', other_asset_category:'', serial_number:'SN-LP-001854', block_name:'', floor:'', room:'', workstation:'', asset_description:'Lenovo ThinkPad X1 Carbon', make_brand_model:'Lenovo ThinkPad X1 Carbon Gen 11', purchase_date:'2025-02-01', operating_system:'Windows 11', other_operating_system:'', ip_address:'10.0.2.188', mac_address:'AA:BB:CC:DD:EE:08', network_connection_type:'Both', edr_installed:'Yes', reason_no_edr:'', uem_installed:'Yes', reason_no_uem:'', asset_user:'Rajesh Kumar', asset_custodian:'IT Help Desk', asset_current_status:'Assigned', date_of_removal:'', installation_date:'2025-02-05', end_of_support_date:'2028-02-01', end_of_life_date:'2030-02-01', amc_warranty:'Yes', amc_warranty_expiry_date:'2028-02-01', critical:'Yes', remarks:'', designation:'IT Analyst', email:'rajesh.kumar@gov.in', phone:'9876543214', custodian:'IT Help Desk' },
    { sr_no:9, ministry:'Ministry of Electronics & IT', department:'Department of IT', mdo_location:'Indira Paryavaran Bhawan', division:'Security', asset_id:'ASM-001855', asset_category:'Scanner', other_asset_category:'', serial_number:'SN-SC-001855', block_name:'', floor:'', room:'', workstation:'', asset_description:'Fujitsu ScanSnap iX1600', make_brand_model:'Fujitsu ScanSnap iX1600', purchase_date:'2024-11-10', operating_system:'', other_operating_system:'', ip_address:'', mac_address:'AA:BB:CC:DD:EE:09', network_connection_type:'', edr_installed:'N/A', reason_no_edr:'', uem_installed:'N/A', reason_no_uem:'', asset_user:'Amit Patel', asset_custodian:'IT Help Desk', asset_current_status:'Assigned', date_of_removal:'', installation_date:'2024-11-15', end_of_support_date:'', end_of_life_date:'', amc_warranty:'Yes', amc_warranty_expiry_date:'', critical:'No', remarks:'', designation:'IT Staff', email:'amit.patel@gov.in', phone:'9876543215', custodian:'IT Help Desk' },
    { sr_no:10, ministry:'Ministry of Defence', department:'Department of IT', mdo_location:'Vigyan Bhawan', division:'Infrastructure', asset_id:'ASM-001856', asset_category:'UPS', other_asset_category:'', serial_number:'SN-UPS-001856', block_name:'', floor:'', room:'', workstation:'', asset_description:'APC Smart-UPS 3000VA', make_brand_model:'APC Smart-UPS 3000VA', purchase_date:'2024-03-01', operating_system:'', other_operating_system:'', ip_address:'10.0.5.10', mac_address:'AA:BB:CC:DD:EE:10', network_connection_type:'Ethernet', edr_installed:'N/A', reason_no_edr:'', uem_installed:'N/A', reason_no_uem:'', asset_user:'', asset_custodian:'IT Help Desk', asset_current_status:'Available', date_of_removal:'', installation_date:'', end_of_support_date:'', end_of_life_date:'', amc_warranty:'Yes', amc_warranty_expiry_date:'', critical:'Yes', remarks:'', designation:'', email:'', phone:'', custodian:'IT Help Desk' },
  ];

  let invInserted = 0;
  const assetIds = [];
  for (const a of assets) {
    try {
      const values = colList.map(col => {
        let val = a[col] !== undefined ? a[col] : null;
        if (['purchase_date','date_of_removal','installation_date','end_of_support_date','end_of_life_date','amc_warranty_expiry_date'].includes(col)) {
          val = val && val.trim() ? new Date(val) : null;
        }
        if (col === 'sr_no') { val = val || null; }
        return val;
      });

      const result = await executeQuery(
        `INSERT INTO inventory (${invCols}) RETURNING id VALUES (${colList.map((_, i) => `$${i + 1}`).join(', ')})`,
        values
      );
      invInserted++;
      assetIds.push(result.rows[0]?.id);
    } catch (e) {
      console.log('Insert error for', a.asset_id, ':', e.message);
    }
  }
  console.log('Inventory items:', invInserted);
  console.log('Asset IDs:', assetIds.join(', '));

  // Seed tickets
  const tickets = [
    { title:'Laptop not booting - ASM-001847', description:'MacBook Pro not powering on. Checked power adapter and cable.', status:'Open', assigned_team:'IT Help Desk', created_by:1, inventory_id: assetIds[0] },
    { title:'Printer jammed - ASM-001849', description:'HP LaserJet showing paper jam error. Toner cartridge needs replacement.', status:'In Progress', assigned_team:'IT Help Desk', created_by:1, inventory_id: assetIds[2] },
    { title:'Network connectivity issue - Room 302', description:'Intermittent WiFi connectivity in Room 302, Block A.', status:'Open', assigned_team:'Network Team', created_by:1, inventory_id:null },
    { title:'Monitor replacement needed - ASM-001848', description:'Dell UltraSharp showing flickering. Needs calibration or replacement.', status:'Pending', assigned_team:'IT Team', created_by:1, inventory_id: assetIds[1] },
    { title:'iPhone not syncing - ASM-001850', description:'iPhone 15 Pro not syncing with corporate email.', status:'In Progress', assigned_team:'IT Help Desk', created_by:1, inventory_id: assetIds[3] },
    { title:'Projector not working in Conference Room B', description:'Epson projector showing no signal. Lamp may need replacement.', status:'Open', assigned_team:'IT Help Desk', created_by:1, inventory_id: assetIds[6] },
    { title:'UPS battery replacement - ASM-001856', description:'UPS beeping continuously. Battery replacement needed.', status:'In Progress', assigned_team:'IT Team', created_by:1, inventory_id: assetIds[9] },
    { title:'New workstation setup for Priya Sharma', description:'Need to set up new Dell OptiPlex for Priya Sharma in Room 205.', status:'Open', assigned_team:'IT Help Desk', created_by:1, inventory_id:null },
  ];

  let ticketInserted = 0;
  for (const t of tickets) {
    try {
      await executeQuery(
        'INSERT INTO tickets (title, description, status, assigned_team, created_by, inventory_id, work_notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [t.title, t.description, t.status, t.assigned_team, t.created_by, t.inventory_id, '']
      );
      ticketInserted++;
    } catch (e) {
      console.log('Ticket error:', t.title, ':', e.message);
    }
  }
  console.log('Tickets:', ticketInserted);

  console.log('Done');
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
