import Call from "../models/Call.js";

/* =========================
   ➜ CREATE CALL (start call)
========================= */
export const createCall = async (req, res) => {
  try {

    console.log("CREATE CALL =>", req.body);
    const { caller, receiver, type } = req.body;

    const call = await Call.create({
      caller,
      receiver,
      type,
      status: "ringing",
      startedAt: new Date(),
    });

    res.status(201).json(call);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   ➜ UPDATE CALL (end call)
========================= */
export const updateCall = async (req, res) => {
  try {

     console.log("UPDATE CALL PARAMS =", req.params);
     console.log("UPDATE CALL BODY =", req.body);

    const { callId } = req.params;
    const { status, duration } = req.body;

    const call = await Call.findByIdAndUpdate(
      callId,
      {
        status,
        duration,
        endedAt: new Date(),
      },
      { new: true },
    );

    

    res.json(call);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   ➜ GET USER CALL HISTORY
========================= */
export const getUserCalls = async (req, res) => {
  try {
    const { userId } = req.params;

    const calls = await Call.find({
      $or: [{ caller: userId }, { receiver: userId }],
    })
      .populate("caller", "name profilePicture")
      .populate("receiver", "name profilePicture")
      .sort({ createdAt: -1 });

    res.json(calls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   ➜ SAVE MISSED CALL
========================= */
export const saveMissedCall = async (req, res) => {
  try {
    const { caller, receiver, type } = req.body;

    const call = await Call.create({
      caller,
      receiver,
      type,
      status: "missed",
      duration: 0,
    });

    res.json(call);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCall = async (req, res) => {
  try {
    await Call.findByIdAndDelete(req.params.id);

    res.json({
      message: "Call deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

export const saveRejectedCall = async (req, res) => {
  try {
    const { caller, receiver, type } = req.body;

    const call = await Call.create({
      caller,
      receiver,
      type,
      status: "rejected",
      duration: 0,
    });

    res.json(call);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
