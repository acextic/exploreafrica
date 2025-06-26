-- ===========================
-- SCHEMA.SQL
-- ===========================

-- Enable UUID extension for future use
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table users (
  user_id uuid primary key default uuid_generate_v4(),
  first_name varchar(50) not null,
  last_name varchar(50) not null,
  email varchar(100) unique not null,
  password_hash varchar(255) not null,
  phone_number varchar(20),
  country varchar(50),
  user_role text check (user_role in ('customer', 'admin', 'staff')) default 'customer',
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

-- DESTINATIONS
create table destinations (
  destination_id serial primary key,
  name varchar(100) not null,
  country varchar(50) not null,
  region_park_id varchar(100),
  description text,
  image_url varchar(255),
  coordinates point,
  active boolean default true
);

-- ACCOMMODATIONS
create table accommodations (
  accommodation_id serial primary key,
  destination_id int references destinations(destination_id),
  name varchar(100) not null,
  owner_id uuid references users(user_id),
  accommodation_type text check (accommodation_type in ('lodge', 'tent', 'hotel', 'camp')),
  price_per_night numeric(10,2) not null,
  max_capacity int not null,
  contact_info varchar(100),
  website_url varchar(255),
  address varchar(255),
  latitude decimal(9,6),
  longitude decimal(9,6),
  amenities json,
  rating_avg decimal(2,1),
  rating_count int
);

-- ACCOMMODATION IMAGES
create table accommodation_images (
  image_id serial primary key,
  accommodation_id int references accommodations(accommodation_id),
  url varchar(255),
  caption varchar(255)
);

-- SAFARI PACKAGES
create table packages (
  package_id serial primary key,
  destination_id int references destinations(destination_id),
  package_name varchar(100) not null,
  description text,
  price_per_person numeric(10,2) not null,
  duration_days int not null,
  active boolean default true
);

-- PACKAGE IMAGES
create table package_images (
  image_id serial primary key,
  package_id int references packages(package_id),
  url varchar(255),
  caption varchar(255)
);

-- BOOKINGS
create table bookings (
  booking_id serial primary key,
  user_id uuid references users(user_id),
  package_id int references packages(package_id),
  accommodation_id int references accommodations(accommodation_id),
  num_of_guests int not null,
  total_amount numeric(10,2) not null,
  booking_status text check (booking_status in ('pending', 'confirmed', 'cancelled', 'completed')) default 'pending',
  booking_date timestamp default current_timestamp,
  check_in_date date,
  check_out_date date,
  travel_date date not null,
  nights int,
  confirmation_number varchar(100) unique,
  cancel_reason text,
  modified_at timestamp default current_timestamp
);

-- PAYMENTS
create table payments (
  payment_id serial primary key,
  booking_id int references bookings(booking_id),
  package_id int references packages(package_id),
  amount_paid numeric(10,2) not null,
  payment_date timestamp default current_timestamp,
  payment_method text check (payment_method in ('credit_card', 'PayPal', 'wire_transfer', 'mobile_money')),
  transaction_ref varchar(100) unique,
  payment_status text check (payment_status in ('pending', 'successful', 'failed')),
  currency char(3),
  processing_fee numeric(10,2),
  refund_status text check (refund_status in ('not_refunded', 'pending', 'refunded')),
  refund_date timestamp
);

-- ITINERARIES
create table itineraries (
  itinerary_id serial primary key,
  package_id int references packages(package_id),
  day_number int,
  activity_description text,
  location varchar(100)
);

-- AVAILABILITY
create table availability (
  availability_id serial primary key,
  accommodation_id int references accommodations(accommodation_id),
  package_id int references packages(package_id),
  start_date date not null,
  end_date date,
  available_units int,
  status text check (status in ('available', 'blocked')),
  block_reason varchar(255),
  created_by uuid references users(user_id),
  created_at timestamp default current_timestamp
);

-- SEASONAL PRICING
create table seasonal_pricing (
  pricing_id serial primary key,
  accommodation_id int references accommodations(accommodation_id),
  package_id int references packages(package_id),
  start_date date not null,
  end_date date,
  price numeric(10,2) not null,
  created_by uuid references users(user_id),
  created_at timestamp default current_timestamp
);

-- CONVERSATIONS
create table conversations (
  conversation_id serial primary key,
  package_id int references packages(package_id),
  booking_id int references bookings(booking_id),
  created_at timestamp default current_timestamp
);

-- MESSAGES
create table messages (
  message_id serial primary key,
  conversation_id int references conversations(conversation_id),
  sender_id uuid references users(user_id),
  receiver_id uuid references users(user_id),
  body text,
  sent_at timestamp default current_timestamp,
  read_at timestamp
);

-- REVIEWS
create table reviews (
  review_id serial primary key,
  user_id uuid references users(user_id),
  package_id int references packages(package_id),
  booking_id int references bookings(booking_id),
  rating int check (rating between 1 and 5),
  comments text,
  review_date timestamp default current_timestamp,
  response_text text,
  response_date timestamp,
  responded_by uuid references users(user_id),
  response_status text check (response_status in ('pending', 'published')),
  helpful_count int
);

-- SUPPORT TICKETS
create table support_tickets (
  ticket_id serial primary key,
  user_id uuid references users(user_id),
  subject varchar(150) not null,
  description text,
  status text check (status in ('open', 'closed', 'pending')),
  created_at timestamp default current_timestamp,
  assigned_to uuid references users(user_id),
  priority text check (priority in ('low', 'medium', 'high')),
  last_updated_at timestamp,
  closed_at timestamp,
  resolution_notes text
);
