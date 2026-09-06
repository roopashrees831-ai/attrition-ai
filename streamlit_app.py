import streamlit as st
<<<<<<< HEAD
import streamlit.components.v1 as components

st.set_page_config(
    page_title="ATTRITION AI",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="collapsed"
)

st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    .block-container {
        padding: 0 !important;
        max-width: 100% !important;
    }

    iframe {
        border: none !important;
    }
</style>
""", unsafe_allow_html=True)

components.iframe(
    "https://attrition-ai.onrender.com",
    height=1000,
    scrolling=True
)
=======

st.set_page_config(
    page_title="Attrition AI",
    page_icon="🤖",
    layout="wide",
)

st.title("ATTRITION AI")
st.write("Employee Attrition Intelligence Platform")

st.success("Streamlit setup is working.")
>>>>>>> 09c8ff5 (Prepare Attrition AI for Streamlit deployment)
