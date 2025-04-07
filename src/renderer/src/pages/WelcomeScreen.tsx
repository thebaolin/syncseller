import { useNavigate } from 'react-router-dom';

const WelcomeScreen = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-[#FFDDE2]">
            <h1 className="text-4xl font-mono mb-4">Welcome to SyncSeller</h1>
            <button onClick={() => navigate('/new-user')} className="px-4 py-2 bg-blue-500 text-white rounded">I am a new user</button>
            <button onClick={() => navigate('/existing-user')} className="px-4 py-2 bg-green-500 text-white rounded">I already have a key</button>
        </div>
    );
};

export default WelcomeScreen;
