
const templates = [
    {
        id: 'pre-arrest-bail',
        name: 'Petition U/S 498 Cr.P.C (Pre-Arrest Bail)',
        description: 'Petition for the grant of pre-arrest bail before the Session Court.',
        category: 'Criminal',
        fields: [
            { name: 'court_name', label: 'Court Name', type: 'text', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'case_number', label: 'Case Number (CRL. MISC. NO)', type: 'text', required: true },
            { name: 'petitioner_name', label: 'Petitioner Name', type: 'text', required: true },
            { name: 'petitioner_father', label: 'Petitioner Father Name', type: 'text', required: true },
            { name: 'petitioner_address', label: 'Petitioner Address', type: 'textarea', required: true },
            { name: 'respondents', label: 'Respondents', type: 'list', required: true },
            { name: 'fir_number', label: 'FIR Number', type: 'text', required: true },
            { name: 'fir_date', label: 'FIR Date', type: 'date', required: true },
            { name: 'offence_sections', label: 'Offence Sections (U/Ss)', type: 'text', required: true },
            { name: 'police_station', label: 'Police Station', type: 'text', required: true },
            { name: 'district', label: 'District', type: 'text', required: true },
            { name: 'allegation_summary', label: 'Allegation Summary', type: 'textarea', required: true },
            { name: 'grounds_list', label: 'Grounds for Bail', type: 'list', required: true },
            { name: 'advocate_name', label: 'Advocate Name', type: 'text', required: true },
            { name: 'advocate_address', label: 'Advocate Address', type: 'textarea', required: true },
            { name: 'date', label: 'Date', type: 'date', required: true }
        ],
        template: `
<h2 style="text-align: center; text-decoration: underline;">IN THE COURT OF SESSION JUDGE, {{court_name}}, {{city}}</h2>
<h3 style="text-align: center;">CRL. MISC. NO. {{case_number}}</h3>

<p>{{petitioner_name}} S/O {{petitioner_father}},<br>
R/O {{petitioner_address}}<br>
........Petitioner</p>

<h3 style="text-align: center;">VERSUS</h3>

<ol>
{{#each respondents}}
<li>{{this}}</li>
{{/each}}
</ol>

<p><strong>CASE FIR NO:</strong> {{fir_number}}, <strong>DATED:</strong> {{fir_date}}<br>
<strong>OFFENCE U/SS:</strong> {{offence_sections}}<br>
<strong>POLICE STATION:</strong> {{police_station}}, <strong>DISTRICT:</strong> {{district}}</p>

<h3 style="text-align: center; text-decoration: underline;">PETITION U/S 498 Cr.P.C FOR THE GRANT OF PRE-ARREST BAIL</h3>

<p><strong>HUMBLY SHEWETH:</strong></p>

<p>1. That the petitioner is implicated in the above-said case with the allegation that {{allegation_summary}}.</p>

<p><strong>GROUNDS:</strong></p>
<ul>
{{#each grounds_list}}
<li>{{this}}</li>
{{/each}}
</ul>

<p><strong>PRAYER:</strong><br>
It is therefore respectfully prayed that this petition may kindly be accepted and the petitioner may be granted pre-arrest bail till the final decision of the case.</p>

<p style="text-align: right;"><strong>Petitioner Through</strong><br>
{{advocate_name}}<br>
{{advocate_address}}</p>

<p><strong>Dated:</strong> {{date}}</p>
`
    },
    {
        id: 'affidavit-pre-arrest',
        name: 'Affidavit (Pre-Arrest Bail)',
        description: 'Affidavit in support of Pre-Arrest Bail Petition.',
        category: 'Legal',
        fields: [
            { name: 'court_name', label: 'Court Name', type: 'text', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'petitioner_name', label: 'Petitioner Name', type: 'text', required: true },
            { name: 'father_name', label: 'Father Name', type: 'text', required: true },
            { name: 'address', label: 'Address', type: 'textarea', required: true },
            { name: 'date', label: 'Date', type: 'date', required: true }
        ],
        template: `
<h2 style="text-align: center; text-decoration: underline;">IN THE COURT OF SESSION JUDGE, {{court_name}}, {{city}}</h2>

<h3 style="text-align: center; text-decoration: underline;">AFFIDAVIT</h3>
<p style="text-align: center;">OF {{petitioner_name}} S/O {{father_name}},<br>
R/O {{address}}</p>

<p>I, the above-named deponent, hereby state on oath:</p>

<p>1. That the contents of the accompanying petition may kindly be treated as an integral part of this affidavit.<br>
2. That the contents are true and correct to the best of my knowledge and belief.</p>

<p><strong>VERIFICATION:</strong><br>
Verified on oath at {{city}} on this {{date}} that the above contents are true and correct.</p>

<p style="text-align: right;"><strong>Deponent</strong></p>
`
    },
    {
        id: 'early-hearing-application',
        name: 'Early Hearing Application (Harassment)',
        description: 'Application for early hearing of a harassment petition.',
        category: 'Civil',
        fields: [
            { name: 'court_name', label: 'Court Name', type: 'text', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'case_title', label: 'Case Title', type: 'text', required: true },
            { name: 'date_fixed', label: 'Date Fixed', type: 'date', required: true },
            { name: 'previous_date', label: 'Previous Date', type: 'date', required: true },
            { name: 'allegations', label: 'Harassment Allegations', type: 'textarea', required: true },
            { name: 'reason_for_early_hearing', label: 'Reason for Early Hearing', type: 'textarea', required: true },
            { name: 'advocate_name', label: 'Advocate Name', type: 'text', required: true },
            { name: 'advocate_address', label: 'Advocate Address', type: 'textarea', required: true },
            { name: 'date', label: 'Date', type: 'date', required: true }
        ],
        template: `
<h2 style="text-align: center; text-decoration: underline;">IN THE COURT OF {{court_name}}, {{city}}</h2>

<h3 style="text-align: center;">{{case_title}}</h3>
<h3 style="text-align: center; text-decoration: underline;">Application for Early Hearing of Harassment Petition</h3>

<p><strong>May it please your Honour:</strong></p>

<p>1. That the petitioner filed a harassment application which was fixed for {{previous_date}}.<br>
2. That on said date, the respondents did not appear and the matter was adjourned to {{date_fixed}}.<br>
3. That respondents are causing harassment: {{allegations}}.<br>
4. That {{reason_for_early_hearing}}.</p>

<p><strong>PRAYER:</strong><br>
It is prayed that this application for early hearing be accepted and an earlier date may kindly be fixed.</p>

<p style="text-align: right;"><strong>Petitioner Through</strong><br>
{{advocate_name}}<br>
{{advocate_address}}</p>

<p><strong>Dated:</strong> {{date}}</p>
`
    },
    {
        id: 'legal-certificate-bail',
        name: 'Legal Certificate (Bail Extension)',
        description: 'Certificate for non-arrest direction / bail extension.',
        category: 'Legal',
        fields: [
            { name: 'advocate_name', label: 'Advocate Name', type: 'text', required: true },
            { name: 'advocate_reference', label: 'Reference No.', type: 'text', required: true },
            { name: 'date', label: 'Date', type: 'date', required: true },
            { name: 'petitioner_names', label: 'Petitioner Names', type: 'list', required: true },
            { name: 'case_number', label: 'Case Number', type: 'text', required: true },
            { name: 'police_station', label: 'Police Station', type: 'text', required: true },
            { name: 'offence_sections', label: 'Offence Sections', type: 'text', required: true },
            { name: 'court_name', label: 'Court Name', type: 'text', required: true },
            { name: 'bail_start_date', label: 'Bail Start Date', type: 'date', required: true },
            { name: 'bail_end_date', label: 'Bail End Date', type: 'date', required: true },
            { name: 'bail_amount', label: 'Bail Amount (Rs.)', type: 'text', required: true }
        ],
        template: `
<p><strong>{{advocate_name}} Advocate High Court</strong><br>
Ref: {{advocate_reference}}<br>
Dated: {{date}}</p>

<h2 style="text-align: center; text-decoration: underline;">CERTIFICATE</h2>

<p>This is to certify that the petitioners:</p>
<ul>
{{#each petitioner_names}}
<li>{{this}}</li>
{{/each}}
</ul>

<p>In Case No. {{case_number}}, Police Station {{police_station}}, Offence {{offence_sections}}, pending before {{court_name}}, have been granted ad-interim pre-arrest bail from {{bail_start_date}} to {{bail_end_date}} in the sum of Rs. {{bail_amount}}.</p>

<p>The petitioners could not submit bail bonds in time; therefore, the local police is directed not to arrest them until final disposal.</p>

<p style="text-align: right;"><strong>{{advocate_name}}</strong><br>
Advocate High Court</p>
`
    },
    {
        id: 'power-of-attorney',
        name: 'Power of Attorney (Vakalatnama)',
        description: 'Legal authorization for advocate representation.',
        category: 'Legal',
        fields: [
            { name: 'case_number', label: 'Case Number', type: 'text', required: true },
            { name: 'offence', label: 'Offence', type: 'text', required: true },
            { name: 'police_station', label: 'Police Station', type: 'text', required: true },
            { name: 'court_name', label: 'Court Name', type: 'text', required: true },
            { name: 'client_name', label: 'Client Name', type: 'text', required: true },
            { name: 'advocate_name', label: 'Advocate Name', type: 'text', required: true },
            { name: 'date', label: 'Date', type: 'date', required: true },
            { name: 'client_signature', label: 'Signature Placeholder (Name)', type: 'text', required: true }
        ],
        template: `
<h2 style="text-align: center; text-decoration: underline;">POWER OF ATTORNEY</h2>

<p><strong>Case No:</strong> {{case_number}}<br>
<strong>Offence:</strong> {{offence}}<br>
<strong>Police Station:</strong> {{police_station}}<br>
<strong>In the Court of:</strong> {{court_name}}</p>

<p>I, <strong>{{client_name}}</strong>, hereby appoint <strong>{{advocate_name}}</strong> Advocate High Court as my counsel to act, appear and plead on my behalf in the above matter and perform all necessary acts, filings, applications, withdrawals, compromises, etc.</p>

<p>I agree to the terms regarding fees and the authority granted.</p>

<p><strong>Signed on:</strong> {{date}}<br>
<strong>Signature:</strong> {{client_signature}}</p>
`
    },
    {
        id: 'affidavit-22a-22b',
        name: 'Affidavit for 22-A / 22-B Cr.P.C',
        description: 'Affidavit for Justice of Peace petition.',
        category: 'Legal',
        fields: [
            { name: 'court_name', label: 'Court Name', type: 'text', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'petitioner_name', label: 'Petitioner Name', type: 'text', required: true },
            { name: 'father_name', label: 'Father Name', type: 'text', required: true },
            { name: 'address', label: 'Address', type: 'textarea', required: true },
            { name: 'affidavit_date', label: 'Date', type: 'date', required: true }
        ],
        template: `
<h2 style="text-align: center; text-decoration: underline;">IN THE COURT OF SESSION JUDGE, {{court_name}}, {{city}}</h2>

<h3 style="text-align: center; text-decoration: underline;">AFFIDAVIT</h3>
<p style="text-align: center;">OF {{petitioner_name}} D/O/S/O {{father_name}},<br>
R/O {{address}}</p>

<p>1. That the petitioner has filed an application under Sections 22-A/22-B Cr.P.C.<br>
2. That whatever stated therein is true and correct.</p>

<p><strong>Verified at</strong> {{city}} <strong>on</strong> {{affidavit_date}}.</p>

<p style="text-align: right;"><strong>Deponent</strong></p>
`
    },
    {
        id: 'cancellation-of-bail',
        name: 'Application for Cancellation of Bail',
        description: 'Application u/s 497(5) Cr.P.C.',
        category: 'Criminal',
        fields: [
            { name: 'court_name', label: 'Court Name', type: 'text', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'petitioner_name', label: 'Petitioner Name', type: 'text', required: true },
            { name: 'father_name', label: 'Father Name', type: 'text', required: true },
            { name: 'address', label: 'Address', type: 'textarea', required: true },
            { name: 'respondents', label: 'Respondents', type: 'list', required: true },
            { name: 'fir_number', label: 'FIR Number', type: 'text', required: true },
            { name: 'fir_date', label: 'FIR Date', type: 'date', required: true },
            { name: 'police_station', label: 'Police Station', type: 'text', required: true },
            { name: 'offence_sections', label: 'Offence Sections', type: 'text', required: true },
            { name: 'incident_summary', label: 'Incident Summary', type: 'textarea', required: true },
            { name: 'injury_details', label: 'Injury Details', type: 'textarea', required: true },
            { name: 'bail_order_date', label: 'Bail Order Date', type: 'date', required: true },
            { name: 'grounds_list', label: 'Grounds for Cancellation', type: 'list', required: true },
            { name: 'advocate_name', label: 'Advocate Name', type: 'text', required: true },
            { name: 'date', label: 'Date', type: 'date', required: true }
        ],
        template: `
<h2 style="text-align: center; text-decoration: underline;">IN THE COURT OF {{court_name}}, {{city}}</h2>

<h3 style="text-align: center; text-decoration: underline;">APPLICATION UNDER SECTION 497(5) Cr.P.C FOR CANCELLATION OF BAIL</h3>

<p>{{petitioner_name}} S/O {{father_name}}<br>
R/O {{address}}<br>
........Petitioner</p>

<h3 style="text-align: center;">VERSUS</h3>

<ol>
{{#each respondents}}
<li>{{this}}</li>
{{/each}}
</ol>

<p>1. That FIR No. {{fir_number}} dated {{fir_date}} was lodged at Police Station {{police_station}} under Sections {{offence_sections}}.<br>
2. <strong>Incident Summary:</strong> {{incident_summary}}<br>
3. <strong>Injury Details:</strong> {{injury_details}}<br>
4. Bail was granted on {{bail_order_date}}.</p>

<p><strong>GROUNDS:</strong></p>
<ul>
{{#each grounds_list}}
<li>{{this}}</li>
{{/each}}
</ul>

<p><strong>PRAYER:</strong><br>
It is respectfully prayed that the bail granted to the respondent be cancelled.</p>

<p style="text-align: right;"><strong>Petitioner Through</strong><br>
{{advocate_name}}<br>
<strong>Dated:</strong> {{date}}</p>
`
    }
];

module.exports = templates;
