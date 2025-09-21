from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from playwright.async_api import async_playwright
import base64
import uvicorn
import time
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import sys
from sgpa_calculator import sgpa


if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


app = FastAPI()

# Allow frontend dev server + any other origins you need
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict later if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 🎓 Request body schema
class GradeRequest(BaseModel):
    roll: str
    semester: str


# 🎓 Semester mapping
SEMESTER_MAP = {
    "I_I": "#cpStudCorner_btn1",
    "I_II": "#cpStudCorner_btn2",
    "II_I": "#cpStudCorner_btn3",
    "II_II": "#cpStudCorner_btn4",
    "III_I": "#cpStudCorner_btn5",
    "III_II": "#cpStudCorner_btn6",
    "IV_I": "#cpStudCorner_btn7",
    "IV_II": "#cpStudCorner_btn8",
}


# 🎯 Endpoint
@app.post("/fetch-grade")
async def fetch_grade(request: GradeRequest):
    start_time = time.time()
    roll = request.roll
    semester = request.semester

    print(f"[INFO] Incoming request: roll={roll}, semester={semester}")

    if semester not in SEMESTER_MAP:
        print("[ERROR] Invalid semester code")
        raise HTTPException(status_code=400, detail="Invalid semester")

    sem_text = semester

    try:
        async with async_playwright() as p:
            print("[INFO] Launching Chromium browser...")
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-setuid-sandbox",
                ],
            )

            page = await browser.new_page()

            # Log browser console messages
            page.on(
                "console", lambda msg: print(f"[BROWSER LOG] {msg.type}: {msg.text}")
            )

            # Block images/fonts for speed
            async def handle_route(route):
                if route.request.resource_type in ["font"]:
                    print(f"[DEBUG] Blocking resource: {route.request.url}")
                    await route.abort()
                else:
                    await route.continue_()

            await page.route("**/*", handle_route)

            # Login page
            print("[INFO] Navigating to login page...")
            await page.goto("https://www.tkrcetautonomous.org/Login.aspx")

            print("[INFO] Clicking login menu...")
            await page.get_by_text("Logins").click()
            await page.get_by_text("Student Login").click()

            print(f"[INFO] Entering roll={roll}")
            await page.fill("#txtUserId", roll)
            await page.fill("#txtPwd", roll)

            print("[INFO] Clicking login button...")
            await page.click("#btnLogin")

            print("[INFO] Waiting for student name...")
            await page.wait_for_selector("#lblStudName")
            student_name = await page.inner_text("#lblStudName")
            print(f"[INFO] Logged in as: {student_name}")

            print("[INFO] Navigating to Marks Details...")
            await page.get_by_text("Marks Details").click()
            await page.get_by_text("Overall Marks - Semwise").click()

            print(f"[INFO] Selecting semester: {sem_text}")
            await page.locator(SEMESTER_MAP[semester]).click()

            print("[INFO] Waiting for CGPA...")
            await page.wait_for_selector("#cpStudCorner_lblFinalCGPA")
            cgpa = await page.inner_text("#cpStudCorner_lblFinalCGPA")
            print(f"[INFO] Found CGPA: {cgpa}")

            # await page.unroute("**/*", handle_route)
            # Take screenshot with images loaded
            # await page.reload()  # reload so resources load this time
            print("[INFO] Taking screenshot...")

            screenshot_bytes = await page.screenshot(full_page=True)
            screenshot_b64 = base64.b64encode(screenshot_bytes).decode("utf-8")
            sgpaValue = await sgpa(page)

            await browser.close()
            print("[INFO] Browser closed")

            processing_time = f"{(time.time() - start_time):.2f}s"
            print(f"[INFO] Processing finished in {processing_time}")

            return {
                "studentName": student_name,
                "cgpa": cgpa,
                "sgpaValue": sgpaValue,  # TODO: extract SGPA if needed
                "screenshots": [{"name": f"{roll}_{semester}", "data": screenshot_b64}],
                "processingTime": processing_time,
            }

    except Exception as e:
        import traceback

        print("[ERROR] Exception occurred:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# 🚀 Run the server
import os

if __name__ == "__main__" and os.environ.get("RAILWAY_ENVIRONMENT") is None:
    uvicorn.run(app, host="0.0.0.0", port=5000)
