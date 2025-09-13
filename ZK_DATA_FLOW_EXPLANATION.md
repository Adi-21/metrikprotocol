# ZK Data Flow Explanation

## 🔍 **Problem Identified**

The original implementation was **redundant and contradictory**:

1. **ZKKycModal** was submitting to BOTH APIs:
   - Regular KYC API (`/api/kyc/submit`) → Stores **plaintext** data
   - ZK KYC API (`/api/kyc/zk-submit`) → Stores **hashes**

2. **This defeated the purpose of ZK privacy** because:
   - Plaintext data was still stored in `kyc_records` table
   - The ZK hashes were just additional metadata
   - Privacy was not actually protected

## ✅ **Corrected Implementation**

### **Pure ZK Privacy Approach**

Now the ZK KYC system works correctly:

1. **ZKKycModal** submits ONLY to ZK API (`/api/kyc/zk-submit`)
2. **No plaintext storage** in regular KYC tables
3. **Only cryptographic hashes** stored in `zk_kyc_records`

### **Data Flow**

```
User Submits KYC with ZK Privacy
           ↓
1. Upload documents to IPFS (for verifier access)
           ↓
2. Generate cryptographic hashes:
   - Company name → SHA256 hash
   - Documents → SHA256 hashes
   - Generate ZK proof
           ↓
3. Store ONLY in zk_kyc_records table:
   - company_data_hash (not plaintext)
   - document_hashes (not file contents)
   - kyc_proof_hash
   - proof_public_signals
           ↓
4. Verifiers can:
   - Verify using hashes (without seeing raw data)
   - Access documents via IPFS for verification
   - See invoice details for verification
```

### **What's Stored Where**

#### **zk_kyc_records table** (ONLY hashes):
```sql
- id: wallet_address (PRIMARY KEY)
- wallet_address: user's wallet
- kyc_status: 'pending_review' | 'verified' | 'rejected'
- company_data_hash: SHA256(company_name + salt)
- document_hashes: JSON array [SHA256(doc1), SHA256(doc2), ...]
- kyc_proof_hash: SHA256(proof_data)
- proof_public_signals: JSON array [hash1, hash2, ...]
- verification_level: 1-4 (Bronze to Diamond)
- expiry_date: timestamp
- jurisdiction: 'US'
- encrypted_data: optional local encryption
- created_at: timestamp
- updated_at: timestamp
```

#### **IPFS** (Documents for verification):
```
- Documents uploaded to IPFS with public URLs
- Verifiers can access documents for verification
- Documents are not stored in database
```

### **Privacy Benefits**

1. **No Plaintext Storage**: Company names and sensitive data never stored in plaintext
2. **Cryptographic Proofs**: Verification can be done using hashes without exposing data
3. **Selective Disclosure**: Verifiers can verify without seeing raw sensitive information
4. **Audit Trail**: All verification activities are cryptographically provable

### **Verifier Access**

**Owner Dashboard** fetches from **BOTH** KYC systems:
- ✅ **Regular KYC**: Plaintext data from `kyc_records` table
- ✅ **ZK KYC**: Hash data from `zk_kyc_records` table
- ✅ See invoice details (amount, due date, supplier, buyer)
- ✅ Verify both regular and ZK KYC submissions
- ✅ Access documents via IPFS for verification
- ❌ Cannot see plaintext company names for ZK submissions
- ❌ Cannot access raw document contents from database for ZK submissions

**Data Sources**:
- **Invoice Data**: Smart contract via `useInvoiceNFT()` hook
- **Regular KYC**: `/api/kyc/admin` → `kyc_records` table (plaintext)
- **ZK KYC**: `/api/kyc/zk-pending` → `zk_kyc_records` table (hashes only)

## 🎯 **Summary**

The corrected implementation now provides **true ZK privacy**:
- Only hashes stored in database
- Documents accessible via IPFS for verification
- No plaintext sensitive data storage
- Cryptographic verification possible without data exposure

This achieves the goal of maintaining privacy while allowing necessary verification functionality.
