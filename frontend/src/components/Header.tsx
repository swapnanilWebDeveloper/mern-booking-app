import { Link } from "react-router-dom"
import { useAppContext } from "../contexts/AppContext";
import SignOutButton from "./SignOutButton";

const Header = () => {
    const {isLoggedIn} = useAppContext();
    return (
        <div className="bg-blue-800 py-6">
          <div className="mx-auto flex justify-between px-12">
            <span className="text-3xl text-white font-bold tracking-tight">
                <Link to="/">MernHolidays.com</Link>
            </span>
            <span className="flex space-x-2">
                {isLoggedIn ? 
                (<div className="flex flex-row space-x-4">
                    <Link 
                     className="flex items-center text-white px-3 font-bold hover:bg-blue-600"
                     to="/my-bookings">
                        My Bookings
                    </Link>
                    <Link 
                     className="flex items-center text-white px-3 font-bold hover:bg-blue-600"
                     to="/my-bookings">
                        My Hotels
                    </Link>
                    <SignOutButton />
                </div>)
                :
                (<Link to="/sign-in" className="flex bg-white items-center text-blue-600 px-3 font-bold hover:bg-gray-300 hover:text-green-500">
                    Sign In
                </Link>)
                }
                
            </span>
          </div>
        </div>
    )
}

export default Header;