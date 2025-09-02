import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js "
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
    // Registration logic here
    const { fullName, email, username, password } = req.body;
    console.log(fullName, email, username, password);
    if(
        [fullName, email, username, password].some((field) => 
        field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{email}, {username}]
    })

    if(existedUser){
        throw new ApiError(409, "Email or username already taken");
    }
    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverLocalPath = req.files?.cover[0]?.path;
    let coverLocalPath;

    if(req.files && Array.isArray(req.files.cover) && req.files.cover.length > 0){
        coverLocalPath = req.files.cover[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const cover = await uploadOnCloudinary(coverLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar upload failed");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        cover: cover?.url || "",
        email,
        password,
        username: username.toLowerCase()
    }) 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500, "User creation failed");
    } 
    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )
});

export {registerUser}
