import { Link } from '@tanstack/react-router';

// About is not a mobile tab. Home and Scoring keep a quiet way in.
export function AboutLink() {
    return (
        <p className='mt-10 mb-0'>
            <Link to='/about' className='text-brand underline-offset-4 hover:underline'>
                About
            </Link>
        </p>
    );
}
