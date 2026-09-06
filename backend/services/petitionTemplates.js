/**
 * Authoritative Pakistani Legal Petition Templates
 * Defines the structure and required factual fields for different legal filings.
 */

const PETITION_TEMPLATES = {
    WRIT_PETITION_199: {
        id: 'WRIT_PETITION_199',
        name: 'Writ Petition (Article 199) - Ultra Precision Package',
        description: 'Perfect High Court package with Index, main petition, affidavits, and applications. Strictly follows provided legal structure.',
        requiredFields: [
            // A. Court & Case Metadata
            { id: 'highCourtName', label: 'Name of High Court', placeholder: 'e.g. Lahore High Court', type: 'text', defaultValue: 'LAHORE HIGH COURT', section: 'A. Court & Case Metadata' },
            { id: 'benchLocation', label: 'Bench / Location', placeholder: 'e.g. Principal Seat', type: 'text', defaultValue: 'LAHORE', section: 'A. Court & Case Metadata' },
            { id: 'petitionNumber', label: 'Writ Petition Number', placeholder: '_____', type: 'text', defaultValue: '_____', section: 'A. Court & Case Metadata' },
            { id: 'filingYear', label: 'Year of Filing', placeholder: '2024', type: 'text', defaultValue: '2024', section: 'A. Court & Case Metadata' },
            
            // B. Petitioner Details
            { id: 'petitionerName', label: 'Full Name of Petitioner', placeholder: '', type: 'text', defaultValue: 'Muhammad Ahmed', section: 'B. Petitioner Details' },
            { id: 'petitionerFather', label: "Father's Name of Petitioner", placeholder: '', type: 'text', defaultValue: 'Muhammad Yousaf', section: 'B. Petitioner Details' },
            { id: 'petitionerCNIC', label: 'CNIC Number of Petitioner', placeholder: '12345-1234567-1', type: 'text', defaultValue: '35202-1234567-1', section: 'B. Petitioner Details' },
            { id: 'petitionerAddress', label: 'Complete Residential Address of Petitioner', placeholder: '', type: 'textarea', defaultValue: 'House No. 123, Street 45, F-7/2, Islamabad', section: 'B. Petitioner Details' },
            { id: 'petitionerStatus', label: "Petitioner's Status", placeholder: 'Individual / Company / Organization', type: 'text', defaultValue: 'Individual', section: 'B. Petitioner Details' },
            
            // C. Respondent Details
            { id: 'respondentAuthority', label: 'Name of Respondent Authority', placeholder: '', type: 'text', defaultValue: 'Federal Government', section: 'C. Respondent Details' },
            { id: 'respondentDesignation', label: 'Designation of Respondent Officer', placeholder: 'e.g. Secretary', type: 'text', defaultValue: 'Secretary', section: 'C. Respondent Details' },
            { id: 'respondentDepartment', label: 'Department / Ministry Name', placeholder: '', type: 'text', defaultValue: 'Ministry of Interior', section: 'C. Respondent Details' },
            { id: 'respondentAddress', label: 'Respondent Address / Office Location', placeholder: '', type: 'textarea', defaultValue: 'Islamabad', section: 'C. Respondent Details' },
            
            // D. Counsel Details
            { id: 'advocateName', label: 'Name of Advocate', placeholder: '', type: 'text', defaultValue: 'Barrister Ali Raza', section: 'D. Counsel Details' },
            { id: 'advocateTitle', label: 'Advocate Enrollment / Title', placeholder: 'Advocate High Court', type: 'text', defaultValue: 'Advocate High Court', section: 'D. Counsel Details' },
            { id: 'lawFirm', label: 'Law Firm Name (if any)', placeholder: '', type: 'text', defaultValue: 'Raza & Associates', section: 'D. Counsel Details' },
            
            // E. Impugned Action / Cause of Action
            { id: 'actionType', label: 'Nature of Impugned Action', placeholder: 'Order / Notice / Decision / Inaction', type: 'text', defaultValue: 'Order', section: 'E. Impugned Action' },
            { id: 'actionDate', label: 'Date of Impugned Order / Action', placeholder: 'DD-MM-YYYY', type: 'text', defaultValue: '15-11-2023', section: 'E. Impugned Action' },
            { id: 'actionRef', label: 'Reference Number of Impugned Order (if any)', placeholder: '', type: 'text', defaultValue: 'No. 123/2023', section: 'E. Impugned Action' },
            { id: 'actionAuth', label: 'Authority Who Passed the Impugned Action', placeholder: '', type: 'text', defaultValue: 'Deputy Commissioner, Islamabad', section: 'E. Impugned Action' },
            
            // F. Facts of the Case
            { id: 'facts', label: 'Complete Statement of Relevant Facts', placeholder: 'Chronological, factual narrative', type: 'textarea', defaultValue: 'The Petitioner is a law-abiding citizen who has been adversely affected by the arbitrary action of the Respondent dated 15-11-2023, which was passed without affording any opportunity of hearing and in complete violation of the principles of natural justice.', section: 'F. Facts' },
            
            // G. Legal Grounds
            { id: 'groundNonSpeaking', label: 'Non-Speaking Order (Yes/No)', placeholder: 'Yes', type: 'text', defaultValue: 'Yes', section: 'G. Legal Grounds' },
            { id: 'groundMalaFide', label: 'Mala Fide / Bad Faith (Yes/No)', placeholder: 'Yes', type: 'text', defaultValue: 'Yes', section: 'G. Legal Grounds' },
            { id: 'groundViolationRights', label: 'Violation of Fundamental Rights (Specify Article(s))', placeholder: 'e.g. 9, 10, 10-A, 25', type: 'text', defaultValue: '9, 10-A, 25', section: 'G. Legal Grounds' },
            { id: 'groundDiscrimination', label: 'Discrimination (Yes/No)', placeholder: 'Yes', type: 'text', defaultValue: 'Yes', section: 'G. Legal Grounds' },
            { id: 'groundNoAuthority', label: 'Lack of Lawful Authority (Yes/No)', placeholder: 'Yes', type: 'text', defaultValue: 'Yes', section: 'G. Legal Grounds' },
            { id: 'groundAdditional', label: 'Any Additional Ground (Free text)', placeholder: '', type: 'textarea', defaultValue: 'The impugned action is also contrary to the settled principles of administrative law.', section: 'G. Legal Grounds' },
            
            // H. Relief / Prayer Details
            { id: 'primaryRelief', label: 'Primary Relief Sought', placeholder: 'e.g. quash impugned order, issue mandamus', type: 'textarea', defaultValue: 'Declare the impugned order dated 15-11-2023 as illegal, without lawful authority, and of no legal effect', section: 'H. Relief Details' },
            { id: 'secondaryRelief', label: 'Secondary / Ancillary Relief (if any)', placeholder: '', type: 'textarea', defaultValue: 'Direct the Respondent to restore the Petitioner to his original position', section: 'H. Relief Details' },
            { id: 'equitableRelief', label: 'Any Other Equitable Relief Requested', placeholder: '', type: 'textarea', defaultValue: 'other relief as this Hon\'ble Court may deem fit in the circumstances of the case', section: 'H. Relief Details' },
            
            // I. Interim Relief
            { id: 'isInterim', label: 'Whether Interim Relief is Sought (Yes/No)', placeholder: 'Yes', type: 'text', defaultValue: 'Yes', section: 'I. Interim Relief' },
            { id: 'interimNature', label: 'Nature of Interim Relief Requested', placeholder: '', type: 'textarea', defaultValue: 'Stay the operation of the impugned order dated 15-11-2023', section: 'I. Interim Relief' },
            { id: 'urgencyJustification', label: 'Urgency Justification', placeholder: '', type: 'textarea', defaultValue: 'The Petitioner will suffer irreparable loss if interim relief is not granted', section: 'I. Interim Relief' },
            { id: 'irreparableLoss', label: 'Irreparable Loss Description', placeholder: '', type: 'textarea', defaultValue: 'The Petitioner\'s fundamental rights are being violated on a daily basis', section: 'I. Interim Relief' },
            
            // J. Documents & Annexures
            { id: 'docsList', label: 'List of Supporting Documents (Names / Titles)', placeholder: '', type: 'textarea', defaultValue: 'Copy of CNIC, Copy of Correspondence', section: 'J. Documents & Annexures' },
            { id: 'annexMapping', label: 'Annexure Mapping (A, B, C, D…)', placeholder: 'B, C, D', type: 'text', defaultValue: 'B, C, D', section: 'J. Documents & Annexures' },
            { id: 'isOriginalAvailable', label: 'Availability of Original Documents', placeholder: 'Available / Not Available', type: 'text', defaultValue: 'Not Available', section: 'J. Documents & Annexures' },
            
            // K. Section 151 CPC
            { id: 'dispensationReason', label: 'Reason for Seeking Dispensation of Originals', placeholder: '', type: 'textarea', defaultValue: 'The Petitioner is making efforts to obtain the certified copies from the concerned department', section: 'K. Section 151 CPC' },
            { id: 'expectedTime', label: 'Expected Time to Obtain Originals (if known)', placeholder: '', type: 'text', defaultValue: 'within 15 days', section: 'K. Section 151 CPC' },
            
            // L. Affidavit Details
            { id: 'deponentName', label: 'Deponent Name', placeholder: '', type: 'text', defaultValue: 'Muhammad Ahmed', section: 'L. Affidavit Details' },
            { id: 'deponentFather', label: "Deponent Father's Name", placeholder: '', type: 'text', defaultValue: 'Muhammad Yousaf', section: 'L. Affidavit Details' },
            { id: 'deponentAddress', label: 'Deponent Residential Address', placeholder: '', type: 'textarea', defaultValue: 'House No. 123, Street 45, F-7/2, Islamabad', section: 'L. Affidavit Details' },
            { id: 'oathCity', label: 'City of Oath Verification', placeholder: '', type: 'text', defaultValue: 'Islamabad', section: 'L. Affidavit Details' },
            { id: 'oathDate', label: 'Date of Oath Verification', placeholder: 'DD-MM-YYYY', type: 'text', defaultValue: '20th day of December, 2024', section: 'L. Affidavit Details' },
            
            // M. Certification & Declaration
            { id: 'isFirstPetition', label: 'Confirmation that this is the First Petition on the Subject Matter (Yes/No)', placeholder: 'Yes', type: 'text', defaultValue: 'Yes', section: 'M. Certification' },
            
            // N. Power of Attorney
            { id: 'isPowerAttorney', label: 'Whether Power of Attorney is Filed (Yes/No)', placeholder: 'Yes', type: 'text', defaultValue: 'Yes', section: 'N. Power of Attorney' }
        ],
        template: `<div style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.8; max-width: 8.5in; margin: 0 auto; padding: 1in;">

<p style="text-align: center; margin-bottom: 60px;"><strong>BEFORE THE {{highCourtName}}, {{benchLocation}}</strong></p>

<p style="text-align: center; margin-bottom: 60px;"><strong>Writ Petition No. {{petitionNumber}}</strong></p>

<p style="margin-bottom: 40px;"><strong>{{petitionerName}}</strong></p>
<p style="margin-bottom: 40px;"><strong>…Petitioner</strong></p>

<p style="text-align: center; margin: 40px 0;"><strong>Versus</strong></p>

<p style="margin-bottom: 20px;"><strong>Federal Government through {{respondentDesignation}}, {{respondentDepartment}}</strong></p>
<p style="margin-bottom: 60px;"><strong>…Respondent</strong></p>

<p style="text-align: center; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 15px 0; margin: 60px 0;"><strong>WRIT PETITION UNDER ARTICLE 199 OF THE CONSTITUTION OF THE ISLAMIC REPUBLIC OF PAKISTAN</strong></p>

<p style="text-align: center; margin: 60px 0 40px 0;"><strong>INDEX</strong></p>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 60px;">
<thead>
<tr>
<th style="border: 1px solid #000; padding: 12px; text-align: left;"><strong>Sr. No.</strong></th>
<th style="border: 1px solid #000; padding: 12px; text-align: left;"><strong>Description of documents</strong></th>
<th style="border: 1px solid #000; padding: 12px; text-align: center;"><strong>Annexure</strong></th>
<th style="border: 1px solid #000; padding: 12px; text-align: center;"><strong>Page</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td style="border: 1px solid #000; padding: 12px;">1</td>
<td style="border: 1px solid #000; padding: 12px;">Writ Petition along with Affidavit</td>
<td style="border: 1px solid #000; padding: 12px; text-align: center;"></td>
<td style="border: 1px solid #000; padding: 12px; text-align: center;"></td>
</tr>
<tr>
<td style="border: 1px solid #000; padding: 12px;">2</td>
<td style="border: 1px solid #000; padding: 12px;">Copy of the {{actionType}}</td>
<td style="border: 1px solid #000; padding: 12px; text-align: center;"><strong>A</strong></td>
<td style="border: 1px solid #000; padding: 12px; text-align: center;"></td>
</tr>
<tr>
<td style="border: 1px solid #000; padding: 12px;">3</td>
<td style="border: 1px solid #000; padding: 12px;">Copy of {{docsList}}</td>
<td style="border: 1px solid #000; padding: 12px; text-align: center;"><strong>B</strong></td>
<td style="border: 1px solid #000; padding: 12px; text-align: center;"></td>
</tr>
<tr>
<td style="border: 1px solid #000; padding: 12px;">4</td>
<td style="border: 1px solid #000; padding: 12px;">Copy of __________</td>
<td style="border: 1px solid #000; padding: 12px; text-align: center;"><strong>C</strong></td>
<td style="border: 1px solid #000; padding: 12px; text-align: center;"></td>
</tr>
<tr>
<td style="border: 1px solid #000; padding: 12px;">5</td>
<td style="border: 1px solid #000; padding: 12px;">Copy of __________</td>
<td style="border: 1px solid #000; padding: 12px; text-align: center;"><strong>D</strong></td>
<td style="border: 1px solid #000; padding: 12px; text-align: center;"></td>
</tr>
<tr>
<td style="border: 1px solid #000; padding: 12px;">8</td>
<td style="border: 1px solid #000; padding: 12px;">Application for Exemption along with Affidavit</td>
<td style="border: 1px solid #000; padding: 12px; text-align: center;"></td>
<td style="border: 1px solid #000; padding: 12px; text-align: center;"></td>
</tr>
<tr>
<td style="border: 1px solid #000; padding: 12px;">9</td>
<td style="border: 1px solid #000; padding: 12px;">Application for Interim Relief along with Affidavit</td>
<td style="border: 1px solid #000; padding: 12px; text-align: center;"></td>
<td style="border: 1px solid #000; padding: 12px; text-align: center;"></td>
</tr>
<tr>
<td style="border: 1px solid #000; padding: 12px;">10</td>
<td style="border: 1px solid #000; padding: 12px;">Power of Attorney</td>
<td style="border: 1px solid #000; padding: 12px; text-align: center;"></td>
<td style="border: 1px solid #000; padding: 12px; text-align: center;"></td>
</tr>
</tbody>
</table>

<div style="margin: 100px 0 120px 0; text-align: right;">
<p><strong>PETITIONER</strong></p>
<p><strong>through</strong></p>
<p><strong>COUNSEL</strong></p>
<p style="margin-top: 80px;"><strong>{{advocateName}}</strong></p>
<p><strong>Advocate High Court</strong></p>
</div>

<div style="page-break-after: always; border-bottom: 3px double #000; margin: 80px 0;"></div>

<p style="text-align: center; margin-bottom: 60px;"><strong>BEFORE THE {{highCourtName}}, {{benchLocation}}</strong></p>

<p style="text-align: center; margin-bottom: 60px;"><strong>Writ Petition No. {{petitionNumber}}</strong></p>

<p style="margin-bottom: 40px;"><strong>{{petitionerName}}</strong></p>
<p style="margin-bottom: 40px;"><strong>…Petitioner</strong></p>

<p style="text-align: center; margin: 40px 0;"><strong>Versus</strong></p>

<p style="margin-bottom: 20px;"><strong>Federal Government through {{respondentDesignation}}, {{respondentDepartment}}</strong></p>
<p style="margin-bottom: 60px;"><strong>…Respondent</strong></p>

<p style="text-align: center; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 15px 0; margin: 60px 0;"><strong>WRIT PETITION UNDER ARTICLE 199 OF THE CONSTITUTION OF THE ISLAMIC REPUBLIC OF PAKISTAN</strong></p>

<p style="margin: 60px 0 40px 0;"><strong><em>Respectfully Sheweth:</em></strong></p>

<p style="text-align: justify; margin-bottom: 30px;">1)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;That, the Petitioner is an aggrieved person whose fundamental rights have been violated by the arbitrary, whimsical and illegal actions of the {{respondentAuthority}}.</p>

<p style="text-align: justify; margin-bottom: 30px;">2)&nbsp;&nbsp;&nbsp;&nbsp;That the Respondent is the executive arm of the Federation. It has been impleaded through {{actionAuth}}.</p>

<p style="text-align: center; margin: 60px 0 40px 0;"><strong>I. FACTS</strong></p>

<p style="text-align: justify; margin-bottom: 30px;">3)&nbsp;&nbsp;&nbsp;&nbsp;{{facts}}</p>

<p style="text-align: center; margin: 60px 0 40px 0;"><strong>II. GROUNDS</strong></p>

<p style="text-align: justify; margin-bottom: 30px;">4)&nbsp;&nbsp;&nbsp;&nbsp;That the Impugned Public Notice is liable to be set aside as it completely illegal, arbitrary and smacks of mala fides for the following reasons:</p>

<p style="margin-left: 80px; margin-bottom: 20px;"><strong>A. NON-SPEAKING ORDER.</strong></p>
<p style="margin-left: 80px; margin-bottom: 20px;"><strong>B. MALA FIDES.</strong></p>
<p style="margin-left: 80px; margin-bottom: 20px;"><strong>C. FUNDAMENTAL RIGHTS.</strong></p>
<p style="margin-left: 80px; margin-bottom: 20px;"><strong>D. DISCRIMINATION.</strong></p>
<p style="margin-left: 80px; margin-bottom: 20px;"><strong>E. CLEAN HANDS.</strong></p>

<p style="margin: 60px 0 40px 0;"><strong>F. THAT THE PETITIONER HUMBLY BEGS LEAVE OF THIS HON'BLE COURT TO SUBMIT SUCH FURTHER ARGUMENTS AS MAY BE AVAILABLE AT THE STAGE OF ORAL ARGUMENTS.</strong></p>

<p style="margin: 60px 0 30px 0;"><strong>PRAYER:</strong></p>

<p style="text-align: justify; margin-bottom: 30px;">In view of the foregoing legal and factual submissions, it is humbly prayed that this Hon'ble Court may kindly:</p>

<p style="margin-left: 80px; margin-bottom: 20px;">i)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{primaryRelief}}</p>
<p style="margin-left: 80px; margin-bottom: 20px;">ii)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Grant such other relief as may be warranted by law and equity.</p>

<div style="margin: 100px 0 80px 0; text-align: right;">
<p><strong>PETITIONER</strong></p>
<p><strong>through</strong></p>
<p style="margin-top: 60px;"><strong>COUNSEL</strong></p>
<p style="margin-top: 80px;"><strong>{{advocateName}}</strong></p>
<p><strong>Advocate High Court</strong></p>
</div>

<p style="margin: 60px 0;"><strong>Certificate:</strong><br/>It is certified that the present petition is the first Writ Petition moved before this Hon'ble Court in respect of the subject matter.</p>

<div style="page-break-after: always; border-bottom: 3px double #000; margin: 120px 0;"></div>

<p style="text-align: center; margin-bottom: 60px;"><strong>BEFORE THE {{highCourtName}}, {{benchLocation}}</strong></p>

<p style="text-align: center; margin-bottom: 60px;"><strong>Writ Petition No. {{petitionNumber}}</strong></p>

<p style="margin-bottom: 40px;"><strong>{{petitionerName}}</strong></p>
<p style="margin-bottom: 40px;"><strong>…Petitioner</strong></p>

<p style="text-align: center; margin: 40px 0;"><strong>Versus</strong></p>

<p style="margin-bottom: 20px;"><strong>Federal Government through {{respondentDesignation}}, {{respondentDepartment}}</strong></p>
<p style="margin-bottom: 60px;"><strong>…Respondent</strong></p>

<p style="text-align: center; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 15px 0; margin: 60px 0;"><strong>WRIT PETITION UNDER ARTICLE 199 OF THE CONSTITUTION OF THE ISLAMIC REPUBLIC OF PAKISTAN</strong></p>

<p style="margin: 60px 0 40px 0;"><strong>AFFIDAVIT:</strong></p>

<p style="text-align: justify; margin-bottom: 40px;">I, <strong>{{deponentName}}</strong>, son of <strong>{{deponentFather}}</strong>, Resident of <strong>{{deponentAddress}}</strong>, do hereby solemnly affirm and declare that the contents of the accompanying Petition are true and correct to the best of my knowledge and belief, and that nothing has been concealed therein from this Hon'ble Court.</p>

<p style="text-align: right; margin: 80px 0;"><strong>DEPONENT</strong></p>

<p style="margin: 60px 0 30px 0;"><strong>Verification:</strong></p>

<p style="text-align: justify; margin-bottom: 40px;">Verified on oath on this the {{oathDate}}, that the contents of my above affidavit are true and correct to the best of my knowledge and belief, and that nothing has been concealed therein.</p>

<p style="text-align: right; margin: 80px 0;"><strong>DEPONENT</strong></p>

<div style="page-break-after: always; border-bottom: 3px double #000; margin: 160px 0;"></div>

<p style="text-align: center; margin-bottom: 60px;"><strong>BEFORE THE {{highCourtName}}, {{benchLocation}}</strong></p>

<p style="text-align: center; margin-bottom: 60px;"><strong>Writ Petition No. {{petitionNumber}}</strong></p>

<p style="margin-bottom: 40px;"><strong>{{petitionerName}}</strong></p>
<p style="margin-bottom: 40px;"><strong>…Petitioner</strong></p>

<p style="text-align: center; margin: 40px 0;"><strong>Versus</strong></p>

<p style="margin-bottom: 20px;"><strong>Federal Government through {{respondentDesignation}}, {{respondentDepartment}}</strong></p>
<p style="margin-bottom: 60px;"><strong>…Respondent</strong></p>

<p style="text-align: center; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 15px 0; margin: 60px 0;"><strong>WRIT PETITION UNDER ARTICLE 199 OF THE CONSTITUTION OF THE ISLAMIC REPUBLIC OF PAKISTAN</strong></p>

<p style="text-align: center; margin: 60px 0 40px 0;"><strong>APPLICATION U/S 151 OF THE CPC, 1908 FOR DISPENSATION WITH THE REQUIREMENT OF FILING OF THE ORIGNIAL DOCUMENTS</strong></p>

<p style="margin: 60px 0 40px 0;"><strong><em>Respectfully Sheweth:</em></strong></p>

<p style="text-align: justify; margin-bottom: 30px;">1.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;That the Petitioner has filed the accompanying Petition.</p>

<p style="text-align: justify; margin-bottom: 30px;">2.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;That along with the said Petition, copies of documents being relied upon have been annexed and filed by the Petitioner.</p>

<p style="text-align: justify; margin-bottom: 30px;">3.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;That the Petitioner is making efforts to obtain the originals/certified copies of the said documents, which shall be placed on the record of this Hon'ble Court, as and when the same are available with them.</p>

<p style="text-align: justify; margin-bottom: 30px;">4.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;That the Petitioner through this instant application prays that the requirement to produce the originals/attested copies of the said documents may be kindly dispensed with in the meanwhile.</p>

<p style="margin: 60px 0 30px 0;"><strong>PRAYER</strong></p>

<p style="text-align: justify; margin-bottom: 40px;">In light of the above submissions, it is respectfully prayed that the production of original / certified copies of the said documents may kindly be dispensed with in the meanwhile.</p>

<div style="margin: 100px 0 80px 0; text-align: right;">
<p><strong>Petitioner</strong></p>
<p><strong>Through</strong></p>
<p style="margin-top: 80px;"><strong>{{advocateName}}</strong></p>
<p><strong>Advocate High Court</strong></p>
</div>

<div style="page-break-after: always; border-bottom: 3px double #000; margin: 120px 0;"></div>

<p style="text-align: center; margin-bottom: 60px;"><strong>BEFORE THE {{highCourtName}}, {{benchLocation}}</strong></p>

<p style="text-align: center; margin-bottom: 60px;"><strong>Writ Petition No. {{petitionNumber}}</strong></p>

<p style="margin-bottom: 40px;"><strong>{{petitionerName}}</strong></p>
<p style="margin-bottom: 40px;"><strong>…Petitioner</strong></p>

<p style="text-align: center; margin: 40px 0;"><strong>Versus</strong></p>

<p style="margin-bottom: 20px;"><strong>Federal Government through {{respondentDesignation}}, {{respondentDepartment}}</strong></p>
<p style="margin-bottom: 60px;"><strong>…Respondent</strong></p>

<p style="text-align: center; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 15px 0; margin: 60px 0;"><strong>WRIT PETITION UNDER ARTICLE 199 OF THE CONSTITUTION OF THE ISLAMIC REPUBLIC OF PAKISTAN</strong></p>

<p style="text-align: center; margin: 60px 0 40px 0;"><strong>APPLICATION FOR INTERIM RELIEF UNDER ORDER39 RULE1 & RULE2, CPC 1908, READ WITH SECTION 151 OF THE CPC,1908 AND ALL OTHER ENABLING PROVISIONS OF LAW</strong></p>

<p style="text-align: justify; margin-bottom: 30px;">1.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;That the above titled Petition has been filed before this Hon'ble Court by the Petitioner and the contents of the same may kindly be read as an integral part of this Application.</p>

<p style="text-align: justify; margin-bottom: 30px;">2.&nbsp;That the Petitioner has a good prima facie case which is likely to be decided in favour of the Petitioner.</p>

<p style="text-align: justify; margin-bottom: 30px;">3.&nbsp;That balance of convenience is also in favour of the Petitioner and if the stay as prayed for is not granted the Petitioner shall suffer irreparable loss and injury.</p>

<p style="margin: 60px 0 30px 0;"><strong>PRAYER:</strong></p>

<p style="text-align: justify; margin-bottom: 30px;">In view of the foregoing, it is most respectfully prayed that this Hon'ble Court may, by way of interim relief:</p>

<p style="margin-left: 80px; margin-bottom: 20px;">(i)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{interimNature}}; AND</p>
<p style="margin-left: 80px; margin-bottom: 20px;">(iii)&nbsp;Grant such other relief which this Hon'ble Court may deem fit in the circumstances of this case may also be granted.</p>

<div style="margin: 100px 0 80px 0; text-align: right;">
<p><strong>Petitioner</strong></p>
<p><strong>Through</strong></p>
<p style="margin-top: 80px;"><strong>{{advocateName}}</strong></p>
<p><strong>Advocate High Court</strong></p>
</div>

<div style="page-break-after: always; border-bottom: 3px double #000; margin: 120px 0;"></div>

<p style="text-align: center; margin-bottom: 60px;"><strong>BEFORE THE {{highCourtName}}, {{benchLocation}}</strong></p>

<p style="text-align: center; margin-bottom: 60px;"><strong>Writ Petition No. {{petitionNumber}}</strong></p>

<p style="margin-bottom: 40px;"><strong>{{petitionerName}}</strong></p>
<p style="margin-bottom: 40px;"><strong>…Petitioner</strong></p>

<p style="text-align: center; margin: 40px 0;"><strong>Versus</strong></p>

<p style="margin-bottom: 20px;"><strong>Federal Government through {{respondentDesignation}}, {{respondentDepartment}}</strong></p>
<p style="margin-bottom: 60px;"><strong>…Respondent</strong></p>

<p style="text-align: center; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 15px 0; margin: 60px 0;"><strong>WRIT PETITION UNDER ARTICLE 199 OF THE CONSTITUTION OF THE ISLAMIC REPUBLIC OF PAKISTAN</strong></p>

<p style="text-align: center; margin: 60px 0 40px 0;"><strong>APPLICATION FOR INTERIM RELIEF UNDER ORDER 39 RULE1 & RULE2, CPC 1908, READ WITH SECTION 151 OF THE CPC,1908 AND ALL OTHER ENABLING PROVISIONS OF LAW</strong></p>

<p style="margin: 60px 0 40px 0;"><strong>AFFIDAVIT</strong></p>

<p style="text-align: justify; margin-bottom: 40px;">I, <strong>{{deponentName}}</strong>, son of <strong>{{deponentFather}}</strong>, Resident of <strong>{{deponentAddress}}</strong> do hereby solemnly affirm and declare that the contents of the accompanying Application for Interim Relief are true and correct to the best of my knowledge and belief, and that nothing has been concealed therein from this Hon'ble Court.</p>

<p style="text-align: right; margin: 80px 0;"><strong>DEPONENT</strong></p>

<p style="margin: 60px 0 30px 0;"><strong>Verification:</strong></p>

<p style="text-align: justify; margin-bottom: 40px;">Verified on oath on this the {{oathDate}}, that the contents of my above affidavit are true and correct to the best of our knowledge and belief, and that nothing has been concealed therein.</p>

<p style="text-align: right; margin: 80px 0;"><strong>DEPONENT</strong></p>

</div>`
    },
    BAIL_APPLICATION_497: {
        id: 'BAIL_APPLICATION_497',
        name: 'Bail Application (Section 497/498 CrPC)',
        description: 'Used for seeking release from custody during trial or before arrest.',
        requiredFields: [
            { id: 'courtName', label: 'Name of Court', placeholder: 'e.g. SESSIONS JUDGE, RAWALPINDI', type: 'text' },
            { id: 'firNo', label: 'FIR Number', placeholder: 'e.g. 104/2023', type: 'text' },
            { id: 'firDate', label: 'FIR Date', placeholder: 'DD/MM/YYYY', type: 'text' },
            { id: 'policeStation', label: 'Police Station', placeholder: 'e.g. P.S. Civil Lines', type: 'text' },
            { id: 'offenses', label: 'Offenses (Sections)', placeholder: 'e.g. 302/324/34 PPC', type: 'text' },
            { id: 'petitionerName', label: 'Accused Name', placeholder: '', type: 'text' },
            { id: 'advocateName', label: 'Advocate Name', placeholder: '', type: 'text' }
        ],
        template: `BEFORE THE {{courtName}}

Crl. Misc. No. _______ / 2024

{{petitionerName}} VS State

FIR NO: {{firNo}}
DATED: {{firDate}}
POLICE STATION: {{policeStation}}
OFFENSES U/S: {{offenses}}

APPLICATION UNDER SECTION 497 CR.P.C. FOR GRANT OF POST-ARREST BAIL

Respectfully Sheweth:
1. That the petitioner has been falsely implicated in the above mentioned case with mala fide intentions.
2. That there is no ocular or circumstantial evidence connecting the petitioner with the alleged offense.
3. That the offenses mentioned do not fall within the prohibitory clause of Section 497 Cr.P.C.

PRAYER:
It is humbly prayed that the petitioner may kindly be released on bail pending trial.

ADVOCATE: {{advocateName}}`
    },
    CIVIL_SUIT: {
        id: 'CIVIL_SUIT',
        name: 'Civil Suit (Plaint)',
        description: 'Standard civil suit for recovery, specific performance, or declaration.',
        requiredFields: [
            { id: 'courtName', label: 'Name of Civil Court', placeholder: 'e.g. SENIOR CIVIL JUDGE, ISLAMABAD', type: 'text' },
            { id: 'plaintiffName', label: 'Plaintiff Name', placeholder: '', type: 'text' },
            { id: 'defendantName', label: 'Defendant Name', placeholder: '', type: 'text' },
            { id: 'suitType', label: 'Nature of Suit', placeholder: 'e.g. Declaration / Recovery', type: 'text' },
            { id: 'suitValue', label: 'Value of Suit (for Jurisdiction)', placeholder: 'e.g. PKR 5,000,000', type: 'text' },
            { id: 'causeOfAction', label: 'Date Cause of Action arose', placeholder: 'DD-MM-YYYY', type: 'text' },
            { id: 'advocateName', label: 'Advocate Name', placeholder: '', type: 'text' }
        ],
        template: `IN THE COURT OF {{courtName}}\\n\\nCivil Suit No. ______ / 2024\\n\\n{{plaintiffName}}\\n...Plaintiff\\n\\nVERSUS\\n\\n{{defendantName}}\\n...Defendant\\n\\nSUIT FOR {{suitType}} AND PERMANENT INJUNCTION\\n\\nRespectfully Sheweth:\\n1. That the plaintiff is a lawful citizen of Pakistan and is entitled to the relief claimed.\\n2. That the cause of action arose on {{causeOfAction}}.\\n3. That the value of the suit for the purposes of court fee and jurisdiction is fixed at {{suitValue}}.\\n\\nPRAYER:\\nIt is respectfully prayed that a decree may kindly be passed in favor of the plaintiff.\\n\\nPLAINTIFF\\nThrough ADVOCATE: {{advocateName}}`
    }
};

module.exports = { PETITION_TEMPLATES };
