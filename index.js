// ============ DOM ELEMENTS ============
const quoteSpan = document.querySelector(".quote-span")
const quoteWrapper = document.querySelector(".quote-wrapper")
const nameSpan = document.querySelector(".name-span")
const loader = document.getElementById("loader")

const nameInput = document.getElementById("input-name")
const activityInput = document.getElementById("favourite-activity")
const placeInput = document.getElementById("favouritePlace")
const inputForm = document.getElementById("input-form")

// ============ STORAGE ============
const imagePromptFromLocalStorage = localStorage.getItem("imagePrompt")
const quotePromptFromLocalStorage = localStorage.getItem("quotePrompt")
const imageUrlFromLocalStorage = localStorage.getItem("imageUrl")
const quoteFromLocalStorage = localStorage.getItem("quote")

// ============ AVATAR ============
const uploadBtn = document.getElementById("upload-btn");
const fileInput = document.getElementById("imageUpload");
const preview = document.getElementById("imagePreview");

uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = "block";
        }
        reader.readAsDataURL(file);
    }
});






// ============ FORM SUBMISSION ============
inputForm.addEventListener("submit", function(event) {
  event.preventDefault()
  
  const name = nameInput.value.trim()
  const favActivity = activityInput.value.trim()
  const favPlace = placeInput.value.trim()
  const temperature = 1
  
  generateTextAndImage(name, favActivity, favPlace, temperature)
})

// ============ LOADING FUNCTIONS ============
function startLoading() {
  nameSpan.style.display = "none"
  quoteWrapper.style.display = "none"
  loader.style.display = "block"
  document.body.style.backgroundImage = ""
}

function stopLoading(name, url, quote) {
  if (!nameSpan || !quoteSpan || !quoteWrapper || !loader) {
    console.error("Missing HTML elements - page not fully loaded")
    return
  }
  
  nameSpan.style.display = "inline"
  quoteWrapper.style.display = "block"
  loader.style.display = "none"
  nameSpan.textContent = `${name} - ${getDate()}`
  
  if (url) {
    document.body.style.backgroundImage = `url(${url})`
  }
  if (quote) {
    quoteSpan.textContent = quote
  }
}

// ============ MAIN GENERATION FUNCTION ============
async function generateTextAndImage(name, favActivity, favPlace, temperature) {
  try {
    console.log("Starting generation with:", { name, favActivity, favPlace })
    startLoading()
    
    const url = await getImage(favPlace)
    console.log("Image URL received:", url ? "✓" : "✗")
    
    const quote = await getQuote(favActivity, favPlace, temperature)
    console.log("Quote received:", quote ? "✓" : "✗")
    
    stopLoading(name, url, quote)
    console.log("Generation complete!")
  } catch (error) {
    console.error("Generation failed:", error)
    loader.style.display = "none"
    quoteSpan.textContent = "Something went wrong. Please try again."
  }
}

// ============ HELPER FUNCTIONS ============
function getDate() {
  const date = new Date()
  const monthIndex = date.getMonth()
  const year = date.getFullYear()

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const monthName = monthNames[monthIndex]

  return `${monthName} ${year}`
}

async function getImage(query) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch(
      `https://apis.scrimba.com/unsplash/photos/random/?count=1&query=${query}`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      const imageUrl = data[0].urls.full
      console.log("Image loaded successfully")
      return imageUrl
    } else {
      console.error(`Image API Error: ${response.status}`)
      return "https://via.placeholder.com/1200x800?text=Image+Failed" // Fallback image
    }
  } catch (error) {
    console.error("Image fetch failed:", error.message)
    return "https://via.placeholder.com/1200x800?text=Connection+Error" // Fallback image
  }
}

async function getQuote(favActivity, favPlace, temperature) {
  try {
    let quotePrompt = `Create a poetic phrase about ${favActivity} and ${favPlace} in the insightful, witty and satirical style of Oscar Wilde. Omit Oscar Wilde's name.`

    if (quotePrompt === quotePromptFromLocalStorage) {
      console.log("Using cached quote")
      return quoteFromLocalStorage
    }

    localStorage.setItem("quotePrompt", quotePrompt)
    let body = {
      model: "text-davinci-003",
      prompt: quotePrompt,
      temperature: temperature,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    let res = await fetch("https://apis.scrimba.com/openai/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      console.error(`Quote API Error: ${res.status}`)
      return "A witty phrase requires time, reflection, and perhaps a cup of tea."
    }

    let response = await res.json()
    
    if (!response.choices || !response.choices[0] || !response.choices[0].text) {
      console.error("Unexpected API response format", response)
      return "The mind is a powerful tool when given proper inspiration."
    }

    let newQuote = response.choices[0].text.trim()
    localStorage.setItem("quote", newQuote)
    console.log("Quote generated successfully")
    return newQuote
  } catch (error) {
    console.error("Quote fetch failed:", error.message)
    return "Every great idea begins with curiosity and imagination."
  }
}
