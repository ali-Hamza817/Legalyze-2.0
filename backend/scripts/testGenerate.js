
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const EMAIL = 'admin@legalyze.com';
const PASSWORD = 'Admin@123';

const testGenerate = async () => {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        
        const token = loginRes.data.data.token;
        console.log('✅ Login successful. Token obtained.');
        
        console.log('2. Testing "pre-arrest-bail" generation...');
        const generateRes = await axios.post(
            `${API_URL}/smart-generate/generate`, 
            {
                documentType: 'pre-arrest-bail',
                allowMissingFields: true,
                fieldOverrides: {
                    court_name: 'Sessions Court Lahore',
                    city: 'Lahore',
                    case_number: '123/2024',
                    petitioner_name: 'Ali Hamza',
                    petitioner_father: 'Muhammad Hamza',
                    petitioner_address: 'House 1, Street 2, Lahore',
                    respondents: ['The State', 'SHO Police Station A'],
                    fir_number: '99/24',
                    fir_date: '2024-01-01',
                    offence_sections: '337-A',
                    police_station: 'Model Town',
                    district: 'Lahore',
                    allegation_summary: 'False allegation of fight',
                    grounds_list: ['Petitioner is innocent', 'No recovery needed'],
                    advocate_name: 'Barrister Khan',
                    advocate_address: 'Lahore High Court',
                    date: '2024-02-01'
                }
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        
        console.log('✅ Generation Response:', generateRes.status);
        if (generateRes.data.success) {
            console.log('📄 Document URL:', generateRes.data.data.document.viewUrl);
            console.log('🎉 SUCCESS! New template logic works.');
        } else {
            console.error('❌ Failed:', generateRes.data);
        }

    } catch (error) {
        console.error('❌ Error during test:', error.response ? error.response.data : error.message);
    }
};

testGenerate();
