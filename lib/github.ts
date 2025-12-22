export async function getGithubStar(repoUrl: string) {
  const url = `https://api.github.com/repos/${repoUrl}`
  const response = await fetch(url)
  if (!response.ok) {
    return new Error("[Failed To Get The Github Stars]")
  }
  const data = await response.json()
  return data.stargazers_count
} 
