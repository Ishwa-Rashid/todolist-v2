const newListBtn = document.querySelector(".new-list-button");
const createNewListBtn = document.querySelector(".name-form button");
const newListContainer = document.querySelector(".new-list-container")
const nameFormContainer = document.querySelector(".name-form-container")


newListBtn.addEventListener("click",function(){
    newListContainer.classList.add("hidden");
    nameFormContainer.classList.remove("hidden")
})

