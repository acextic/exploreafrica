-- policies.sql — Row-Level Security for ExploreAfrica Platform

-- Enable RLS for all relevant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- User: Can only see their own user record
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Bookings: User can manage their own bookings
CREATE POLICY "User can view own bookings" ON bookings
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "User can insert own booking" ON bookings
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "User can update own booking" ON bookings
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Messages: Sender or Receiver can view
CREATE POLICY "User can read their messages" ON messages
  FOR SELECT USING (
    auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text
  );

-- Messages: Only sender can write
CREATE POLICY "User can send message" ON messages
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);

-- Conversations: Show if user is involved via messages
CREATE POLICY "User can view related conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.conversation_id = conversations.conversation_id
      AND (messages.sender_id::text = auth.uid()::text OR messages.receiver_id::text = auth.uid()::text)
    )
  );

-- Reviews: Only reviewers can see their own or public
CREATE POLICY "User can view own review" ON reviews
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "User can create review" ON reviews
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Payments: View own
CREATE POLICY "User can view their own payments" ON payments
  FOR SELECT USING (
    auth.uid()::text = (
      SELECT user_id FROM bookings WHERE bookings.booking_id = payments.booking_id
    )::text
  );

-- Support Tickets: Submit and view own
CREATE POLICY "User can view their own tickets" ON support_tickets
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "User can submit ticket" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Admin/Staff override logic can be added later with roles or separate table joins
