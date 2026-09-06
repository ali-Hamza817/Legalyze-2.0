// Mock chat conversations
export const mockChats = [
    {
        id: 1,
        title: 'NDA Document Help',
        timestamp: '2 hours ago',
        messages: [
            { role: 'user', content: 'I need help creating an NDA document' },
            { role: 'assistant', content: 'I can help you create a Non-Disclosure Agreement. Would you like to use our NDA template or do you have specific requirements?' }
        ]
    },
    {
        id: 2,
        title: 'Employment Contract Query',
        timestamp: '1 day ago',
        messages: [
            { role: 'user', content: 'What should be included in an employment contract?' },
            { role: 'assistant', content: 'An employment contract should include: job title, responsibilities, compensation, benefits, work schedule, termination clauses, and confidentiality agreements.' }
        ]
    },
    {
        id: 3,
        title: 'Lease Agreement Review',
        timestamp: '3 days ago',
        messages: []
    }
];

// Document templates
export const documentTemplates = [
    {
        id: 'house-rent',
        name: 'House Rent Agreement',
        description: 'Residential Lease Agreement',
        icon: 'HomeIcon',
        fields: [
            { name: 'landlordName', label: 'Landlord Name', type: 'text', required: true },
            { name: 'landlordFatherName', label: "Landlord's Father Name", type: 'text', required: true },
            { name: 'landlordAddress', label: 'Landlord Address', type: 'textarea', required: true },
            { name: 'companyName', label: 'Company Name (Lessee)', type: 'text', required: true },
            { name: 'directorName', label: 'Director Name', type: 'text', required: true },
            { name: 'propertyAddress', label: 'Property Address', type: 'textarea', required: true },
            { name: 'monthlyRent', label: 'Monthly Rent Amount', type: 'number', required: true },
            { name: 'leaseStartDate', label: 'Lease Start Date', type: 'date', required: true },
            { name: 'dateOfAgreement', label: 'Date of Agreement', type: 'date', required: true },
            { name: 'signingPlace', label: 'Place of Signing', type: 'text', required: true },
            { name: 'signingDate', label: 'Date of Signing', type: 'date', required: true },
            { name: 'witness1Name', label: 'Witness 1 Name', type: 'text', required: true },
            { name: 'witness2Name', label: 'Witness 2 Name', type: 'text', required: true }
        ]
    },
    {
        id: 'pre-arrest-bail',
        name: 'Petition U/S 498 Cr.P.C (Pre-Arrest Bail)',
        description: 'Petition for grant of pre-arrest bail',
        icon: 'GavelIcon',
        fields: [
            { name: 'court_name', label: 'Court Name', type: 'text', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'case_number', label: 'Case Number', type: 'text', required: true },
            { name: 'petitioner_name', label: 'Petitioner Name', type: 'text', required: true },
            { name: 'petitioner_father', label: 'Petitioner Father Name', type: 'text', required: true },
            { name: 'petitioner_address', label: 'Petitioner Address', type: 'textarea', required: true },
            { name: 'respondents', label: 'Respondents', type: 'list', required: true },
            { name: 'fir_number', label: 'FIR Number', type: 'text', required: true },
            { name: 'fir_date', label: 'FIR Date', type: 'date', required: true },
            { name: 'offence_sections', label: 'Offence Sections', type: 'text', required: true },
            { name: 'police_station', label: 'Police Station', type: 'text', required: true },
            { name: 'district', label: 'District', type: 'text', required: true },
            { name: 'allegation_summary', label: 'Allegation Summary', type: 'textarea', required: true },
            { name: 'grounds_list', label: 'Grounds for Bail', type: 'list', required: true },
            { name: 'advocate_name', label: 'Advocate Name', type: 'text', required: true },
            { name: 'advocate_address', label: 'Advocate Address', type: 'textarea', required: true },
            { name: 'date', label: 'Date', type: 'date', required: true }
        ]
    },
    {
        id: 'affidavit-pre-arrest',
        name: 'Affidavit (Pre-Arrest Bail)',
        description: 'Affidavit in support of Pre-Arrest Bail Petition',
        icon: 'DescriptionIcon',
        fields: [
            { name: 'court_name', label: 'Court Name', type: 'text', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'petitioner_name', label: 'Petitioner Name', type: 'text', required: true },
            { name: 'father_name', label: 'Father Name', type: 'text', required: true },
            { name: 'address', label: 'Address', type: 'textarea', required: true },
            { name: 'date', label: 'Date', type: 'date', required: true }
        ]
    },
    {
        id: 'early-hearing-application',
        name: 'Early Hearing Application',
        description: 'Application for early hearing of a case',
        icon: 'EventIcon',
        fields: [
            { name: 'court_name', label: 'Court Name', type: 'text', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'case_title', label: 'Case Title', type: 'text', required: true },
            { name: 'date_fixed', label: 'Date Fixed', type: 'date', required: true },
            { name: 'previous_date', label: 'Previous Date', type: 'date', required: true },
            { name: 'allegations', label: 'Harassment/Details', type: 'textarea', required: true },
            { name: 'reason_for_early_hearing', label: 'Reason for Early Hearing', type: 'textarea', required: true },
            { name: 'advocate_name', label: 'Advocate Name', type: 'text', required: true },
            { name: 'advocate_address', label: 'Advocate Address', type: 'textarea', required: true },
            { name: 'date', label: 'Date', type: 'date', required: true }
        ]
    },
    {
        id: 'legal-certificate-bail',
        name: 'Legal Certificate (Bail)',
        description: 'Certificate for non-arrest direction',
        icon: 'VerifiedUserIcon',
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
            { name: 'bail_amount', label: 'Bail Amount', type: 'text', required: true }
        ]
    },
    {
        id: 'power-of-attorney',
        name: 'Power of Attorney (Vakalatnama)',
        description: 'Legal authorization for advocate representation',
        icon: 'WorkIcon',
        fields: [
            { name: 'case_number', label: 'Case Number', type: 'text', required: true },
            { name: 'offence', label: 'Offence', type: 'text', required: true },
            { name: 'police_station', label: 'Police Station', type: 'text', required: true },
            { name: 'court_name', label: 'Court Name', type: 'text', required: true },
            { name: 'client_name', label: 'Client Name', type: 'text', required: true },
            { name: 'advocate_name', label: 'Advocate Name', type: 'text', required: true },
            { name: 'date', label: 'Date', type: 'date', required: true },
            { name: 'client_signature', label: 'Signature Placeholder', type: 'text', required: true }
        ]
    },
    {
        id: 'cancellation-of-bail',
        name: 'Cancellation of Bail Application',
        description: 'Application u/s 497(5) Cr.P.C',
        icon: 'BlockIcon',
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
        ]
    },
    {
        id: 'affidavit-22a-22b',
        name: 'Affidavit (22-A / 22-B Cr.P.C)',
        description: 'Affidavit for Justice of Peace petition',
        icon: 'DescriptionIcon',
        fields: [
            { name: 'court_name', label: 'Court Name', type: 'text', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'petitioner_name', label: 'Petitioner Name', type: 'text', required: true },
            { name: 'father_name', label: 'Father Name', type: 'text', required: true },
            { name: 'address', label: 'Address', type: 'textarea', required: true },
            { name: 'affidavit_date', label: 'Date', type: 'date', required: true }
        ]
    }
];

// Generated documents (mock)
export const generatedDocuments = [
    {
        id: 1,
        name: 'NDA_TechCorp_2024.pdf',
        type: 'NDA Document',
        date: '2024-11-25',
        size: '245 KB'
    },
    {
        id: 2,
        name: 'Employment_Contract_JohnDoe.pdf',
        type: 'Employment Contract',
        date: '2024-11-20',
        size: '189 KB'
    }
];

// User profile (mock)
export const mockUser = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: null
};
