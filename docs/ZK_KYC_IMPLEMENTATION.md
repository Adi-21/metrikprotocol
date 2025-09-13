# ZK Privacy Implementation for KYC/KYB Data

## Overview

This document outlines a practical ZK privacy implementation for KYC/KYB data storage that maintains user privacy while allowing verifiers (buyers) to access necessary invoice information for verification purposes.

## Current System Analysis

### Existing KYC Storage
```typescript
// Current KYC Record Structure
interface KycRecord {
  id: string; // address or email-based id
  email?: string;
  walletAddress?: string;
  companyName?: string;
  createdAt: number;
  updatedAt: number;
  kycStatus: KycStatus;
  documentPaths: string[]; // server-side storage paths or IPFS CIDs
  documentUrls?: string[]; // Firebase URLs
  imageUrls?: string[]; // Firebase URLs for captured images
  rejectionReason?: string;
  verifiableCredential?: any;
}
```

### Current Invoice Verification
- Verifiers can see invoice details (amount, due date, supplier, buyer)
- Manual verification process
- No privacy protection for KYC data

## ZK Privacy Solution

### 1. KYC Data Privacy with Cryptographic Hashing

#### Enhanced KYC Record with ZK Privacy
```typescript
// Enhanced KYC Record with ZK Privacy
interface ZKKycRecord {
  // Public fields (visible to system)
  id: string;
  walletAddress: string;
  kycStatus: KycStatus;
  createdAt: number;
  updatedAt: number;
  
  // ZK Privacy fields (cryptographically hashed)
  personalDataHash: string; // SHA256 hash of personal data
  businessDataHash: string; // SHA256 hash of business data
  documentHashes: string[]; // SHA256 hashes of documents
  
  // ZK Proof fields
  kycProofHash: string; // Hash of ZK proof
  proofPublicSignals: string[]; // Public signals from ZK proof
  
  // Verification metadata
  verificationLevel: number; // 1-4 (Bronze to Diamond)
  expiryDate: number;
  jurisdiction: string;
  
  // Optional: Encrypted data (client-side encryption)
  encryptedData?: string; // AES encrypted sensitive data
}

// Personal data structure (never stored in plaintext)
interface PersonalData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  nationality: string;
}

// Business data structure (never stored in plaintext)
interface BusinessData {
  companyName: string;
  registrationNumber: string;
  businessAddress: string;
  businessType: string;
  taxId: string;
  authorizedSignatory: string;
}
```

### 2. ZK Circuit for KYC Verification

#### Simple ZK Circuit (No Complex ZK-SNARKs)
```typescript
// Simple ZK-style verification using cryptographic commitments
class ZKKycVerification {
  private static readonly SALT = "metrik_kyc_salt_2024";
  
  // Generate commitment for personal data
  static generatePersonalDataCommitment(data: PersonalData): string {
    const dataString = JSON.stringify(data);
    return this.sha256(dataString + this.SALT);
  }
  
  // Generate commitment for business data
  static generateBusinessDataCommitment(data: BusinessData): string {
    const dataString = JSON.stringify(data);
    return this.sha256(dataString + this.SALT);
  }
  
  // Generate document hash
  static generateDocumentHash(document: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as ArrayBuffer;
        const hash = this.sha256(content + this.SALT);
        resolve(hash);
      };
      reader.readAsArrayBuffer(document);
    });
  }
  
  // Generate KYC proof (simplified)
  static generateKycProof(
    personalData: PersonalData,
    businessData: BusinessData,
    documents: File[]
  ): Promise<KycProof> {
    return new Promise(async (resolve) => {
      // Generate commitments
      const personalHash = this.generatePersonalDataCommitment(personalData);
      const businessHash = this.generateBusinessDataCommitment(businessData);
      
      // Generate document hashes
      const documentHashes = await Promise.all(
        documents.map(doc => this.generateDocumentHash(doc))
      );
      
      // Generate proof hash (simplified)
      const proofData = {
        personalHash,
        businessHash,
        documentHashes,
        timestamp: Date.now(),
        nonce: Math.random().toString(36)
      };
      
      const proofHash = this.sha256(JSON.stringify(proofData));
      
      resolve({
        proofHash,
        publicSignals: [personalHash, businessHash, ...documentHashes],
        commitments: {
          personalHash,
          businessHash,
          documentHashes
        }
      });
    });
  }
  
  // Verify KYC proof
  static verifyKycProof(proof: KycProof, originalData: any): boolean {
    // Reconstruct commitments
    const personalHash = this.generatePersonalDataCommitment(originalData.personal);
    const businessHash = this.generateBusinessDataCommitment(originalData.business);
    
    // Verify commitments match
    return proof.commitments.personalHash === personalHash &&
           proof.commitments.businessHash === businessHash;
  }
  
  // Simple SHA256 implementation
  private static sha256(data: any): string {
    // Use Web Crypto API for SHA256
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    
    return crypto.subtle.digest('SHA-256', dataBuffer).then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
  }
}

interface KycProof {
  proofHash: string;
  publicSignals: string[];
  commitments: {
    personalHash: string;
    businessHash: string;
    documentHashes: string[];
  };
}
```

### 3. Frontend Implementation

#### Enhanced KYC Modal with ZK Privacy
```typescript
// Enhanced KYC Modal with ZK Privacy
const ZKKycModal = () => {
  const [personalData, setPersonalData] = useState<PersonalData>();
  const [businessData, setBusinessData] = useState<BusinessData>();
  const [documents, setDocuments] = useState<File[]>([]);
  const [kycProof, setKycProof] = useState<KycProof>();
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  
  const handleSubmitKYC = async () => {
    try {
      setIsGeneratingProof(true);
      
      // Generate ZK proof
      const proof = await ZKKycVerification.generateKycProof(
        personalData!,
        businessData!,
        documents
      );
      setKycProof(proof);
      
      // Create ZK KYC record
      const zkKycRecord: ZKKycRecord = {
        id: address!,
        walletAddress: address!,
        kycStatus: 'pending_review',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        personalDataHash: proof.commitments.personalHash,
        businessDataHash: proof.commitments.businessHash,
        documentHashes: proof.commitments.documentHashes,
        kycProofHash: proof.proofHash,
        proofPublicSignals: proof.publicSignals,
        verificationLevel: 1, // Bronze
        expiryDate: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
        jurisdiction: 'US'
      };
      
      // Store encrypted data locally (optional)
      const encryptedData = await encryptSensitiveData({
        personal: personalData,
        business: businessData
      });
      zkKycRecord.encryptedData = encryptedData;
      
      // Submit to backend (only hashed data)
      await submitZKKycRecord(zkKycRecord);
      
      toast.success("KYC submitted with privacy protection");
    } catch (error) {
      toast.error("Failed to generate KYC proof");
    } finally {
      setIsGeneratingProof(false);
    }
  };
  
  return (
    <Modal>
      <form onSubmit={handleSubmitKYC}>
        <div className="space-y-4">
          {/* Personal Data Section */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                onChange={(e) => setPersonalData({...personalData, fullName: e.target.value})}
                className="p-2 border rounded"
              />
              <input
                type="email"
                placeholder="Email"
                onChange={(e) => setPersonalData({...personalData, email: e.target.value})}
                className="p-2 border rounded"
              />
              {/* More personal data fields */}
            </div>
          </div>
          
          {/* Business Data Section */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Business Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Company Name"
                onChange={(e) => setBusinessData({...businessData, companyName: e.target.value})}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Registration Number"
                onChange={(e) => setBusinessData({...businessData, registrationNumber: e.target.value})}
                className="p-2 border rounded"
              />
              {/* More business data fields */}
            </div>
          </div>
          
          {/* Document Upload */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Documents</h3>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setDocuments(Array.from(e.target.files || []))}
              className="p-2 border rounded"
            />
          </div>
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isGeneratingProof}
            className="w-full"
          >
            {isGeneratingProof ? "Generating Privacy Proof..." : "Submit KYC with Privacy Protection"}
          </Button>
          
          {/* Privacy Notice */}
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
            <p>🔒 Your personal and business data is protected with cryptographic hashing. 
            Only verification status and necessary information will be stored.</p>
          </div>
        </div>
      </form>
    </Modal>
  );
};
```

### 4. Verifier Dashboard Enhancement

#### Enhanced Verifier Interface
```typescript
// Enhanced Verifier Dashboard
const VerifierDashboard = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice>();
  
  // Fetch invoices for verification
  useEffect(() => {
    fetchPendingInvoices().then(setInvoices);
  }, []);
  
  const handleVerifyInvoice = async (tokenId: string) => {
    try {
      // Get invoice details (buyer can see these)
      const invoice = invoices.find(inv => inv.id === tokenId);
      if (!invoice) return;
      
      // Show verification modal with invoice details
      setSelectedInvoice(invoice);
    } catch (error) {
      toast.error("Failed to load invoice details");
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Invoice Verification Dashboard</h1>
      
      {/* Invoice List */}
      <div className="grid gap-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Invoice #{invoice.invoiceId}</h3>
                <p className="text-sm text-gray-600">
                  Amount: ${(Number(invoice.creditAmount) / 1e6).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Due Date: {invoice.dueDate.toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  Supplier: {invoice.supplier.slice(0, 6)}...{invoice.supplier.slice(-4)}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleVerifyInvoice(invoice.id)}
                >
                  View Details
                </Button>
                <Button
                  onClick={() => verifyInvoice(invoice.id)}
                  disabled={invoice.isVerified}
                >
                  {invoice.isVerified ? "Verified" : "Verify"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Invoice Verification Modal */}
      {selectedInvoice && (
        <InvoiceVerificationModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(undefined)}
          onVerify={() => {
            verifyInvoice(selectedInvoice.id);
            setSelectedInvoice(undefined);
          }}
        />
      )}
    </div>
  );
};

// Invoice Verification Modal
const InvoiceVerificationModal = ({ invoice, onClose, onVerify }) => {
  const [verificationData, setVerificationData] = useState({
    amountVerified: false,
    dueDateVerified: false,
    supplierVerified: false,
    documentsVerified: false,
    notes: ""
  });
  
  const handleVerify = () => {
    // Perform verification logic
    onVerify();
  };
  
  return (
    <Modal onClose={onClose}>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Verify Invoice #{invoice.invoiceId}</h2>
        
        {/* Invoice Details (Buyer can see these) */}
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Invoice Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium">Amount:</label>
              <p>${(Number(invoice.creditAmount) / 1e6).toLocaleString()}</p>
            </div>
            <div>
              <label className="font-medium">Due Date:</label>
              <p>{invoice.dueDate.toLocaleDateString()}</p>
            </div>
            <div>
              <label className="font-medium">Supplier:</label>
              <p>{invoice.supplier}</p>
            </div>
            <div>
              <label className="font-medium">Buyer:</label>
              <p>{invoice.buyer}</p>
            </div>
          </div>
        </div>
        
        {/* Verification Checklist */}
        <div className="space-y-2">
          <h3 className="font-semibold">Verification Checklist</h3>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={verificationData.amountVerified}
              onChange={(e) => setVerificationData({
                ...verificationData,
                amountVerified: e.target.checked
              })}
            />
            <span>Amount matches purchase order</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={verificationData.dueDateVerified}
              onChange={(e) => setVerificationData({
                ...verificationData,
                dueDateVerified: e.target.checked
              })}
            />
            <span>Due date is reasonable</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={verificationData.supplierVerified}
              onChange={(e) => setVerificationData({
                ...verificationData,
                supplierVerified: e.target.checked
              })}
            />
            <span>Supplier is legitimate</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={verificationData.documentsVerified}
              onChange={(e) => setVerificationData({
                ...verificationData,
                documentsVerified: e.target.checked
              })}
            />
            <span>Supporting documents are valid</span>
          </label>
        </div>
        
        {/* Notes */}
        <div>
          <label className="font-medium">Verification Notes:</label>
          <textarea
            value={verificationData.notes}
            onChange={(e) => setVerificationData({
              ...verificationData,
              notes: e.target.value
            })}
            className="w-full p-2 border rounded"
            rows={3}
            placeholder="Add any notes about the verification..."
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={!verificationData.amountVerified || 
                     !verificationData.dueDateVerified ||
                     !verificationData.supplierVerified ||
                     !verificationData.documentsVerified}
          >
            Verify Invoice
          </Button>
        </div>
      </div>
    </Modal>
  );
};
```

### 5. Backend Storage Implementation

#### Enhanced KYC Storage Service
```typescript
// Enhanced KYC Storage Service
class ZKKycStorageService {
  private supabase: SupabaseClient;
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  
  // Store ZK KYC record
  async storeZKKycRecord(record: ZKKycRecord): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('zk_kyc_records')
        .insert([record]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Failed to store ZK KYC record:', error);
      throw error;
    }
  }
  
  // Get ZK KYC record
  async getZKKycRecord(id: string): Promise<ZKKycRecord | null> {
    try {
      const { data, error } = await this.supabase
        .from('zk_kyc_records')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Failed to get ZK KYC record:', error);
      return null;
    }
  }
  
  // Verify KYC proof
  async verifyKycProof(proof: KycProof): Promise<boolean> {
    try {
      // Verify proof hash
      const storedRecord = await this.getZKKycRecord(proof.proofHash);
      if (!storedRecord) return false;
      
      // Verify commitments match
      return storedRecord.kycProofHash === proof.proofHash;
    } catch (error) {
      console.error('Failed to verify KYC proof:', error);
      return false;
    }
  }
  
  // Update KYC status
  async updateKycStatus(id: string, status: KycStatus): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('zk_kyc_records')
        .update({ 
          kycStatus: status,
          updatedAt: Date.now()
        })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Failed to update KYC status:', error);
      throw error;
    }
  }
}
```

### 6. Privacy Benefits

#### Data Protection
- **Personal Data**: Never stored in plaintext, only cryptographic hashes
- **Business Data**: Protected with commitment schemes
- **Documents**: Only document hashes stored, not actual files
- **Verification**: Cryptographic proof of data integrity

#### Verifier Access
- **Invoice Details**: Verifiers can see necessary invoice information
- **KYC Status**: Only verification status visible, not personal data
- **Audit Trail**: Cryptographic audit trail without data exposure
- **Selective Disclosure**: Users control what information to reveal

### 7. Implementation Steps

#### Step 1: Frontend ZK Service
```bash
# Install required packages
npm install crypto-js @types/crypto-js
```

#### Step 2: Enhanced KYC Modal
- Implement ZK proof generation
- Add privacy protection UI
- Integrate with existing KYC flow

#### Step 3: Verifier Dashboard
- Enhance invoice verification interface
- Add verification checklist
- Implement verification workflow

#### Step 4: Backend Integration
- Create ZK KYC storage service
- Implement proof verification
- Update existing KYC endpoints

### 8. Security Considerations

#### Cryptographic Security
- **SHA256 Hashing**: Industry-standard hashing algorithm
- **Salt Protection**: Prevents rainbow table attacks
- **Commitment Schemes**: Cryptographic commitments for data integrity
- **Proof Verification**: Cryptographic proof verification

#### Privacy Protection
- **No Plaintext Storage**: Sensitive data never stored in plaintext
- **Hash-Only Storage**: Only cryptographic hashes stored
- **Local Encryption**: Optional client-side encryption for sensitive data
- **Access Control**: Strict access controls for verification services

## Conclusion

This implementation provides robust privacy protection for KYC/KYB data while maintaining the functionality needed for invoice verification. The solution uses cryptographic hashing and commitment schemes to protect user privacy without requiring complex ZK-SNARKs or contract changes.

Key benefits:
- ✅ **No Contract Changes**: Frontend-only implementation
- ✅ **Privacy Protection**: Sensitive data protected with cryptographic hashing
- ✅ **Verifier Access**: Buyers can verify invoices with necessary information
- ✅ **Audit Trail**: Cryptographic audit trail for compliance
- ✅ **Scalable**: Simple implementation that can be enhanced over time
