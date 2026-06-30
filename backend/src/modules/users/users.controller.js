import * as usersService from './users.service.js';

export const getProfile = async (req, res) => {
  try {
    // The user ID comes from the JWT token parsed by our authMiddleware
    const userId = req.user.id;
    
    const profile = await usersService.getUserProfile(userId);
    
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const getHeatmap = async (req, res) => {
  try {
    const userId = req.user.id;
    const heatmap = await usersService.getUserHeatmap(userId);
    res.status(200).json({ success: true, data: heatmap });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const solveQuestion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { problemName } = req.body;
    
    if (!problemName) {
      return res.status(400).json({ success: false, message: 'Problem name is required' });
    }
    
    await usersService.recordSubmission(userId, problemName);
    res.status(200).json({ success: true, message: 'Submission recorded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    
    if (!updateData.username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    
    const updatedProfile = await usersService.updateUserProfile(userId, updateData);
    res.status(200).json({ success: true, data: updatedProfile, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchUser = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Player ID is required' });
    }
    
    const user = await usersService.searchUserById(id.toUpperCase());
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await usersService.getLeaderboard();
    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
