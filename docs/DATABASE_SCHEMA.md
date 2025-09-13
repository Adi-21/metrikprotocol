# Database Schema for ZK KYC Integration

## Supabase Table: `zk_kyc_records`

This table extends the existing KYC system to store ZK privacy-protected data.

```sql
CREATE TABLE zk_kyc_records (
  id TEXT PRIMARY KEY, -- wallet address or email (lowercase)
  wallet_address TEXT NOT NULL,
  kyc_status TEXT NOT NULL DEFAULT 'pending_review', -- 'not_submitted', 'pending_review', 'verified', 'rejected'
  company_data_hash TEXT NOT NULL, -- SHA256 hash of company data
  document_hashes TEXT NOT NULL, -- JSON array of document hashes
  kyc_proof_hash TEXT NOT NULL, -- ZK proof hash
  proof_public_signals TEXT NOT NULL, -- JSON array of public signals
  verification_level INTEGER DEFAULT 1, -- 1=Bronze, 2=Silver, 3=Gold, 4=Diamond
  expiry_date TIMESTAMP, -- KYC expiry date
  jurisdiction TEXT DEFAULT 'US', -- Jurisdiction
  encrypted_data TEXT, -- Optional encrypted sensitive data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_zk_kyc_wallet_address ON zk_kyc_records(wallet_address);
CREATE INDEX idx_zk_kyc_status ON zk_kyc_records(kyc_status);
CREATE INDEX idx_zk_kyc_created_at ON zk_kyc_records(created_at);
```

## Integration with Existing KYC System

The ZK KYC system works alongside the existing `kyc_records` table:

1. **Existing KYC System**: Stores standard KYC data in `kyc_records`
2. **ZK KYC System**: Stores privacy-protected data in `zk_kyc_records`
3. **Dual Submission**: Users can submit to both systems for maximum compatibility

## Data Flow

1. **User Submits KYC**:
   - Standard KYC data → `kyc_records` table
   - ZK privacy data → `zk_kyc_records` table

2. **Verifier Reviews**:
   - Can see standard KYC data (if authorized)
   - Can verify ZK proof without seeing sensitive data

3. **Privacy Protection**:
   - Personal/business data only stored as cryptographic hashes
   - Original data never stored in plaintext
   - Verifiers see only verification status and necessary information

## API Endpoints

- `POST /api/kyc/zk-submit` - Submit ZK KYC data
- `GET /api/kyc/zk-status?id=<address>` - Get ZK KYC status
- `GET /api/kyc/zk-pending` - Get pending ZK KYC records
- `POST /api/kyc/zk-update` - Update ZK KYC status

## Security Considerations

- All sensitive data is cryptographically hashed before storage
- No plaintext personal/business information in database
- ZK proofs provide cryptographic verification without data exposure
- Optional client-side encryption for additional security
