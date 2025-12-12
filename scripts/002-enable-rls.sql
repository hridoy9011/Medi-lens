-- Enable Row Level Security on all tables

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE authenticity_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_interactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Users can insert own prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Users can delete own prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Users can view own extracted data" ON extracted_data;
DROP POLICY IF EXISTS "Users can insert extracted data for own prescriptions" ON extracted_data;
DROP POLICY IF EXISTS "Users can view own medicines" ON medicines;
DROP POLICY IF EXISTS "Users can insert medicines for own prescriptions" ON medicines;
DROP POLICY IF EXISTS "Users can view own authenticity results" ON authenticity_results;
DROP POLICY IF EXISTS "Users can insert authenticity results for own prescriptions" ON authenticity_results;
DROP POLICY IF EXISTS "Users can view own drug interactions" ON drug_interactions;
DROP POLICY IF EXISTS "Users can insert interactions for own prescriptions" ON drug_interactions;

-- Profiles: Users can only view and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Prescriptions: Users can only access their own prescriptions
CREATE POLICY "Users can view own prescriptions" ON prescriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prescriptions" ON prescriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prescriptions" ON prescriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Extracted Data: Users can access data from their prescriptions
CREATE POLICY "Users can view own extracted data" ON extracted_data
  FOR SELECT USING (
    prescription_id IN (
      SELECT id FROM prescriptions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert extracted data for own prescriptions" ON extracted_data
  FOR INSERT WITH CHECK (
    prescription_id IN (
      SELECT id FROM prescriptions WHERE user_id = auth.uid()
    )
  );

-- Medicines: Users can access medicines from their prescriptions
CREATE POLICY "Users can view own medicines" ON medicines
  FOR SELECT USING (
    extracted_data_id IN (
      SELECT ed.id FROM extracted_data ed
      JOIN prescriptions p ON ed.prescription_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert medicines for own prescriptions" ON medicines
  FOR INSERT WITH CHECK (
    extracted_data_id IN (
      SELECT ed.id FROM extracted_data ed
      JOIN prescriptions p ON ed.prescription_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Authenticity Results: Users can access results from their prescriptions
CREATE POLICY "Users can view own authenticity results" ON authenticity_results
  FOR SELECT USING (
    prescription_id IN (
      SELECT id FROM prescriptions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert authenticity results for own prescriptions" ON authenticity_results
  FOR INSERT WITH CHECK (
    prescription_id IN (
      SELECT id FROM prescriptions WHERE user_id = auth.uid()
    )
  );

-- Drug Interactions: Users can access interactions from their prescriptions
CREATE POLICY "Users can view own drug interactions" ON drug_interactions
  FOR SELECT USING (
    prescription_id IN (
      SELECT id FROM prescriptions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert interactions for own prescriptions" ON drug_interactions
  FOR INSERT WITH CHECK (
    prescription_id IN (
      SELECT id FROM prescriptions WHERE user_id = auth.uid()
    )
  );
