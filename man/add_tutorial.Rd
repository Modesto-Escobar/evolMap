\name{add_tutorial}
\alias{add_tutorial}
\title{Adds a tutorial for the map.}
\description{
\code{add_tutorial} adds a tutorial for a map. 
}
\value{
Object of class \code{evolMap}.
}

\usage{
add_tutorial(map, image = NULL, description = NULL)
}
\arguments{
\item{map}{object of class \code{evolMap}.}
\item{image}{character vector indicating the image path, header for the tutorial.}
\item{description}{a character string indicating a desription text to insert in the tutorial.}
}
\author{
Modesto Escobar, Department of Sociology and Communication, University of Salamanca.
}
\examples{
# create map
map <- create_map()
map <- add_tutorial(map)

\dontrun{
# plot map
plot(map)
}
}
