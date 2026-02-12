import { randomIntBetween } from 'k6';

export default function () {
    console.log('Testing randomIntBetween...');
    const num = randomIntBetween(1, 10);
    console.log(`Generated number: ${num}`);
}
