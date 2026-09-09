B2B Appointment Booking Platform

A multi-tenant appointment booking SaaS built with React, Tailwind CSS, Node.js, Express, and MongoDB.

Features

System Owner login and business management

Create Business with Business Admin details

Enable/Disable and delete businesses

Business Admin login

Business profile management

Service CRUD

Service-specific date/time availability

Public business and service browsing

Customer login/register only when booking

Appointment booking and cancellation

Customer appointment history

Multi-tenant authorization and data isolation

MongoDB Atlas support

Project Structure

b2b-appointment-platform/
├── client/     # React + Vite + Tailwind frontend
├── server/     # Node.js + Express API
├── .gitignore
└── README.md

Requirements

Node.js 20+

MongoDB Atlas or MongoDB 4.2+

npm

Setup

Backend

cd server
npm install
npm run dev

Frontend

cd client
npm install
npm run dev

Open:

http://localhost:5173/login

Public Booking

Customers can browse businesses and services without logging in.

Login is required only when confirming an appointment.

Browse Business
→ Select Service
→ Select Date/Time
→ Login/Register
→ Confirm Booking
→ My Appointments




