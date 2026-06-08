import React from 'react';

export default function RecipeCard({ recipe }) {
  return (
    <div className="recipe-card">
      <div className="recipe-emoji">{recipe.emoji}</div>
      <div className="recipe-content">
        <h4>{recipe.name}</h4>
        <p className="recipe-author">by {recipe.author}</p>
        <button className="recipe-view-btn">보기</button>
      </div>
    </div>
  );
}
