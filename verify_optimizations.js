import axios from 'axios';

async function testFetch() {
    try {
        console.log("Testing optimized product fetch...");
        const start = Date.now();
        const response = await axios.get('http://localhost:5000/api/products?limit=5');
        const end = Date.now();

        console.log(`Status: ${response.status}`);
        console.log(`Fetch took: ${end - start}ms`);
        console.log(`Number of products returned: ${response.data.length}`);

        if (response.data.length > 0) {
            console.log("Fields in first product:", Object.keys(response.data[0]));
        }

    } catch (err) {
        console.error("Error during verification:", err.message);
    }
}

testFetch();
