function classifyCubes(gl) {
    gl.useProgram(gl.constructHistoPyramidProgram);
    // since we have large volumes, and GPU memory isnt infinite, we pack the number of triangles and the cubeIndex into 
    // a single float32 in the hpbaselevel. The levels above will just count the number of triangles.

    gl.uniform1i(gl.getUniformLocation(gl.constructHistoPyramidProgram, "functionID"), 0);
    gl.uniform1f(gl.getUniformLocation(gl.constructHistoPyramidProgram, "isoLevel"), 1000.0);

    gl.uniform1i(gl.getUniformLocation(gl.constructHistoPyramidProgram, "volumeFloatTexture"), 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, gl.textureVolume);

    gl.bindImageTexture(1, gl.textureHistoPyramid, 0, true, 0, gl.WRITE_ONLY, gl.R32UI);
    gl.bindImageTexture(2, gl.textureNrTriangles, 0, false, 0, gl.READ_ONLY, gl.R32UI);

    gl.dispatchCompute(divup(gl.size, 8), divup(gl.size, 8), divup(gl.size, 8));
    gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);

}

function constructHistoPyramid(gl) {
    gl.useProgram(gl.constructHistoPyramidProgram);

    gl.uniform1i(gl.getUniformLocation(gl.constructHistoPyramidProgram, "functionID"), 1);
    gl.uniform1i(gl.getUniformLocation(gl.constructHistoPyramidProgram, "hpLevel"), 0);

    gl.uniform1i(gl.getUniformLocation(gl.constructHistoPyramidProgram, "histoPyramidTexture"), 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, gl.textureHistoPyramid);


    // gl.bindImageTexture(2, gl.textureHistoPyramid, 0, false, 0, gl.READ_ONLY, gl.R32F)
    // gl.bindImageTexture(1, gl.textureHistoPyramid, 1, false, 0, gl.WRITE_ONLY, gl.R32F)

    // gl.dispatchCompute(divup(gl.size >> 1, 8), divup(gl.size >> 1, 8), divup(gl.size >> 1, 8));
    // gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);


    for (let i = 0; i < 9; i++)
    {
        //gl.bindImageTexture(0, gl.textureHistoPyramid, i, false, 0, gl.READ_ONLY, gl.R32F)
        gl.bindImageTexture(1, gl.textureHistoPyramid, i + 1, true, 0, gl.WRITE_ONLY, gl.R32UI)

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, gl.ssboHPSum);

        gl.uniform1i(gl.getUniformLocation(gl.constructHistoPyramidProgram, "hpLevel"), i);
        gl.uniform1i(gl.getUniformLocation(gl.constructHistoPyramidProgram, "histoPyramidTexture"), 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_3D, gl.textureHistoPyramid);

        gl.dispatchCompute(divup(gl.size >> (i + 1), 8), divup(gl.size >> (i + 1), 8), divup(gl.size >> (i + 1), 8));
        gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);
    }


    const outData = new Float32Array(1);
    gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, gl.ssboHPSum);
    gl.getBufferSubData(gl.SHADER_STORAGE_BUFFER, 0, outData);
    console.log(outData);

    gl.totalSumVerts = outData * 3;
}

function traverseHistoPyramid(gl) {
    gl.useProgram(gl.traverseHistoPyramidProgram);

    gl.uniform1i(gl.getUniformLocation(gl.traverseHistoPyramidProgram, "histoPyramidTexture"), 0);
    gl.uniform1i(gl.getUniformLocation(gl.traverseHistoPyramidProgram, "volumeFloatTexture"), 1);
    //gl.uniform1i(gl.getUniformLocation(gl.traverseHistoPyramidProgram, "triTable"), 2);
    //gl.uniform1i(gl.getUniformLocation(gl.traverseHistoPyramidProgram, "offsets3"), 3);

    gl.uniform2fv(gl.getUniformLocation(gl.traverseHistoPyramidProgram, "scaleVec"), [128.0, 384.0]);
    gl.uniform1ui(gl.getUniformLocation(gl.traverseHistoPyramidProgram, "totalSum"), (gl.totalSumVerts / 3));
    gl.uniform1f(gl.getUniformLocation(gl.traverseHistoPyramidProgram, "isoLevel"), 1000.0);


    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, gl.textureHistoPyramid);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, gl.textureVolume);

    gl.bindImageTexture(0, gl.textureTriTable, 0, false, 0, gl.READ_ONLY, gl.R32UI);
    gl.bindImageTexture(1, gl.textureOffsets3, 0, false, 0, gl.READ_ONLY, gl.R32UI);

    // gl.activeTexture(gl.TEXTURE2);
    // gl.bindTexture(gl.TEXTURE_2D, gl.textureTriTable);
    // gl.activeTexture(gl.TEXTURE3);
    // gl.bindTexture(gl.TEXTURE_2D, gl.textureOffsets3);

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, gl.ssboHPVerts);
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, gl.ssboHPNorms);

    gl.dispatchCompute(divup(gl.totalSumVerts / 3, 32), 1, 1);
    gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);



    //const outData = new Float32Array(512*128*128*4);
   // gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, gl.ssboHPVerts);
    //gl.getBufferSubData(gl.SHADER_STORAGE_BUFFER, 0, outData);
}