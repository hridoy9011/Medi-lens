-- MediLens Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescriptions table to store uploaded prescription images
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  ocr_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extracted data from prescriptions
CREATE TABLE IF NOT EXISTS extracted_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  doctor TEXT,
  hospital TEXT,
  prescription_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medicines extracted from prescriptions
CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  extracted_data_id UUID REFERENCES extracted_data(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dose TEXT,
  frequency TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Authenticity check results
CREATE TABLE IF NOT EXISTS authenticity_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  authenticity TEXT CHECK (authenticity IN ('genuine', 'suspicious', 'fake')),
  reasons TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drug interactions found
CREATE TABLE IF NOT EXISTS drug_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  drug_a TEXT NOT NULL,
  drug_b TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('none', 'mild', 'moderate', 'severe')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_extracted_data_prescription_id ON extracted_data(prescription_id);
CREATE INDEX IF NOT EXISTS idx_medicines_extracted_data_id ON medicines(extracted_data_id);
CREATE INDEX IF NOT EXISTS idx_authenticity_prescription_id ON authenticity_results(prescription_id);
CREATE INDEX IF NOT EXISTS idx_interactions_prescription_id ON drug_interactions(prescription_id);
