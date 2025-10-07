import React, { useEffect, useState } from 'react';

const useUrl = (url) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(url)
            .then((result) => result.json())
            .then((data) => {
                setData(data);
                setLoading(false)
            })
    }, [url])


    console.log("Render the useUrl" , loading)

    return {data , loading};
}


export {useUrl};