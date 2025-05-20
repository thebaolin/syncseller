import { useNavigate } from 'react-router-dom'

const WelcomeScreen = () => {
    const navigate = useNavigate()

    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-[#FFDDE2]">
            <h1 className="text-4xl font-mono mb-4">Welcome to SyncSeller!</h1>
            <button
                onClick={() => navigate('/new-user')}
                className="bg-sagegreen border-1 border-gray-500 rounded-sm shadow p-[5px] text-black hover:bg-dustyrose hover:text-white w-[250px] mx-[20px] my-[15px]"
            >
                I am a new user
            </button>
            <button
                onClick={() => navigate('/existing-user')}
                className="bg-purple-300 border-1 border-gray-500 rounded-sm shadow p-[5px] text-black hover:bg-dustyrose hover:text-white w-[250px] mx-[20px] my-[15px]"
            >
                I already have a key
            </button>
        </div>
    )
}

export default WelcomeScreen
