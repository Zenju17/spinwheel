# Spin Wheel Event Game

A simple Spin & Win web game built with HTML, CSS, JavaScript, Firebase Firestore, and GitHub Pages.

This project is designed for an event-day prize wheel where customers can spin once after making a purchase. The wheel tracks prize limits, blocks sold-out prizes, stores spin history online using Firebase Firestore, and includes a PIN-protected admin dashboard.

---

## Features

* Spin wheel game using HTML Canvas
* Responsive mobile/tablet-friendly design
* Logo on the top of the page
* Logo in the center of the spin wheel
* Firebase Firestore integration
* Prize limit tracking
* Sold-out prize blocking
* Spin history tracking
* Small admin dashboard
* 4-digit PIN required to open admin dashboard
* Reset prize count button with 4-digit PIN confirmation
* GitHub Pages compatible
* Works locally before deployment

---

## Project Structure

```text
spinwheel/
├── index.html
├── style.css
├── script.js
└── image/
    └── MV_Logo.png
```

---

## Technologies Used

* HTML
* CSS
* JavaScript
* Firebase Firestore
* Firebase Web SDK
* GitHub Pages

---

## Current Prize Setup

The wheel has 8 total slices.

```text
Good Luck: 4/8
50% Off Voucher: 2/8
Free Mini Waffle Soft Serve: 1/8
Free 1 Drink: 1/8
```

Current chance:

```text
Good Luck: 50%
50% Off Voucher: 25%
Free Mini Waffle Soft Serve: 12.5%
Free 1 Drink: 12.5%
```

---

## Firebase Firestore Structure

Firestore has two main collections:

```text
prizes
spin_history
```

---

## Firestore Collection: prizes

Create a collection named:

```text
prizes
```

Inside it, create these documents:

```text
good_luck
fifty_off
soft_serve
free_drink
```

Each document should have these fields:

```text
name: string
limit: number
won: number
active: boolean
```

Example:

```text
Document ID: fifty_off

name: "50% Off Voucher"
limit: 20
won: 0
active: true
```

Example:

```text
Document ID: soft_serve

name: "Free Mini Waffle Soft Serve"
limit: 20
won: 0
active: true
```

Example:

```text
Document ID: free_drink

name: "Free 1 Drink"
limit: 10
won: 0
active: true
```

Example:

```text
Document ID: good_luck

name: "Good Luck"
limit: 999999
won: 0
active: true
```

---

## Firestore Collection: spin_history

Create a collection named:

```text
spin_history
```

This collection stores every spin result automatically.

Each spin history document stores:

```text
prizeId
prizeName
isGoodLuck
createdAt
source
```

Example:

```text
prizeId: "fifty_off"
prizeName: "50% Off Voucher"
isGoodLuck: false
createdAt: server timestamp
source: "spin_wheel_tablet"
```

---

## How Prize Limit Works

Before the wheel spins, the app checks Firestore.

If a prize already reached its limit, it will not be selected.

Example:

```text
Free 1 Drink
limit: 10
won: 10
remaining: 0
```

The wheel will show that slice as:

```text
Sold Out
```

The customer will not win a sold-out prize.

---

## Admin Dashboard

The page includes a small admin dashboard.

The admin dashboard requires a 4-digit PIN before opening.

The dashboard shows:

```text
Prize name
Won count
Prize limit
Remaining quantity
Recent spin history
```

The dashboard also includes:

```text
Reset Prize Counts button
```

The reset button requires the 4-digit PIN again before resetting.

When reset is confirmed, it sets all prize `won` values back to:

```text
0
```

The reset button does not delete spin history.

---

## Admin PIN

The admin PIN is set inside `script.js`.

Example:

```javascript
const ADMIN_PIN = "1111";
```

Change this before event day if needed.

Important:

This PIN is only basic protection because it is inside frontend JavaScript. It is useful to stop normal customers or staff from accidentally opening the dashboard or resetting counts, but it is not strong security.

For a small event with one tablet, this is acceptable.

---

## Local Testing

Do not push to GitHub immediately if the team might accidentally use the live link.

Test locally first:

```bash
cd /home/zenju/Documents/spinwheel
python3 -m http.server 5500
```

Then open:

```text
http://127.0.0.1:5500/
```

or:

```text
http://localhost:5500/
```

Important:

Do not open `index.html` directly by double-clicking it. Use a local server because Firebase module imports work better through `http://`.

---

## GitHub Deployment

When ready for event day:

```bash
git status
git add .
git commit -m "Add Firestore prize tracking and admin dashboard"
git push origin main
```

Then open the GitHub Pages link on the event tablet.

---

## Event Day Checklist

Before event day:

```text
1. Open Firebase Console
2. Go to Firestore Database
3. Reset all prize won values to 0
4. Set the correct limit for each prize
5. Make sure active is true for all usable prizes
6. Change ADMIN_PIN in script.js if needed
7. Publish the Firestore security rules
8. Push the latest code to GitHub
9. Open GitHub Pages link on the tablet
10. Test one spin if needed
11. Keep the same tablet/browser during the event
```

---

## Important Notes

The Firebase config in `script.js` is okay to be visible in frontend code. The real protection comes from Firestore Security Rules.

Do not leave Firestore fully open with:

```javascript
allow read, write: if true;
```

Use that only temporarily for testing.

For the event, use the safer Firestore rules included below.

---

## Recommended Event Use

Use only one tablet for the event.

Avoid:

```text
Private browsing mode
Clearing browser data during the event
Changing Firestore data while customers are spinning
Letting staff click the live GitHub link before the event starts
```

The actual prize count is stored in Firestore, so it can still be viewed from Firebase Console even after the event.

---

## Firestore Security Rules for Event Day

Paste this into:

<<<<<<< HEAD
```text
=======
```
>>>>>>> 1983563 (Add Firestore prize tracking and admin dashboard)
Firebase Console → Firestore Database → Rules
```

Then click:

<<<<<<< HEAD
```text
=======
```
>>>>>>> 1983563 (Add Firestore prize tracking and admin dashboard)
Publish
```

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function validPrizeId(prizeId) {
      return prizeId in [
        'good_luck',
        'fifty_off',
        'soft_serve',
        'free_drink'
      ];
    }

    function validHistoryCreate() {
      return request.resource.data.keys().hasOnly([
        'prizeId',
        'prizeName',
        'isGoodLuck',
        'createdAt',
        'source'
      ])
      && validPrizeId(request.resource.data.prizeId)
      && request.resource.data.prizeName is string
      && request.resource.data.isGoodLuck is bool
      && request.resource.data.source == 'spin_wheel_tablet'
      && request.resource.data.createdAt == request.time;
    }

    match /prizes/{prizeId} {
      allow read: if true;

      allow update: if validPrizeId(prizeId)
        && resource.data.active == true
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['won'])
        && (
          request.resource.data.won == resource.data.won + 1
          ||
          request.resource.data.won == 0
        )
        && request.resource.data.won <= resource.data.limit;

      allow create: if false;
      allow delete: if false;
    }

    match /spin_history/{historyId} {
      allow read: if true;
      allow create: if validHistoryCreate();

      allow update: if false;
      allow delete: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## What These Rules Allow

Allowed:

```text
Read prize data
Read spin history
Increase prize won count by exactly +1
Reset prize won count to 0
Create valid spin history records
```

Blocked:

```text
Changing prize limit from the website
Changing prize name from the website
Changing active status from the website
Deleting prizes
Deleting spin history
Editing spin history
Creating fake prize documents
Writing to other collections
```

---

## Reset Behavior

The app reset button only resets this field:

```text
won: 0
```

It does not reset:

```text
limit
active
name
spin_history
```

If you want to clear spin history, do it manually in Firebase Console.

---

## Final Event Day Flow

```text
1. Staff opens GitHub Pages link on tablet
2. Customer makes one purchase
3. Customer spins the wheel
4. App checks Firestore prize limits
5. Sold-out prizes are blocked
6. Prize result is saved to Firestore
7. Admin dashboard can be opened using 4-digit PIN
8. Staff can view remaining prize stock
9. Admin can reset counts only with PIN
```
