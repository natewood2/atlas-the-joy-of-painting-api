# Console Catalog of Bob Ross's Data

Welcome to the Bob Ross API 🎨! This API is filled with data about the colors he used, air dates, and subject matter! I have also used `chalk` to create a better user experience within the console.

## Tech Stack

I used a combination of:
- TypeScript
- Node.js
- Express.js 
- PostgreSQL

to handle the various `csv` files containing the Bob Ross data.

## Challenges

The data required cleaning to properly output well-formatted information for our catalog. Many entries contained extra spacing and needed to be sorted by their categories.

## Viewing The Data

To view the data:

This can be done by running the command `nodemon index.ts` this will start the Express sever. The open another terminal and start running some curl requests. Examples: One Color `curl "http://localhost:3000/episodes?colors=Sap%20Green"` or for multple colors `curl "http://localhost:3000/episodes?colors[]=Sap%20Green&colors[]=Titanium%20White"`

You will see on the terminal running the Express server this:


<img width="977" alt="Screenshot 2024-12-01 at 8 57 06 PM" src="https://github.com/user-attachments/assets/e57cb866-288e-4774-8d9a-ccedbfb615e9">




