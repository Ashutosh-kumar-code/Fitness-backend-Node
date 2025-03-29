exports.startCall = (req, res) => {
    const { userId, trainerId } = req.body;
    
    if (!userId || !trainerId) {
        return res.status(400).json({ error: 'User ID and Trainer ID are required' });
    }

    return res.status(200).json({ message: `Call started between ${userId} and ${trainerId}` });
};
