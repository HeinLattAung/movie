import React, { createContext, useContext, useState, useEffect } from 'react'

const FavoritesContext = createContext()

const STORAGE_KEY = 'krakenFavorites'

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  }, [favorites])

  const addFavorite = (movie) => {
    setFavorites(prev => {
      if (prev.some(m => m.id === movie.id)) return prev
      return [...prev, movie]
    })
  }

  const removeFavorite = (movieId) => {
    setFavorites(prev => prev.filter(m => m.id !== movieId))
  }

  const isFavorite = (movieId) => favorites.some(m => m.id === movieId)

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export const useFavorites = () => useContext(FavoritesContext)
