
import {fetchGrade} from '../controllers/fetchGrade.controller.js';
import express from "express";

const router = express.Router();


router.post("/fetch-grade", fetchGrade);

export default router;
