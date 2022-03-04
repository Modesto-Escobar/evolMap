\name{add_description}
\alias{add_description}
\title{Add Periods.}
\description{
Add a description to show in screen. 
}
\value{
Object of class \code{evolMap}.
}

\usage{
add_description(map, content = "", width = NULL)
}
\arguments{
\item{map}{an object of class \code{evolMap}.}
\item{content}{a character string indicating a desription text for the graph.}
\item{width}{a percentage indicating a width for the description panel (25 by default).}
}
\author{
Modesto Escobar, Department of Sociology and Communication, University of Salamanca.
}
\examples{
# create map
map <- create_map()
map <- add_description(map, "Lorem ipsum dolor sit amet, consectetur adipiscing elit.")

\dontrun{
# plot map
plot(map)
}
}
