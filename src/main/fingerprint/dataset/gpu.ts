import { GPURendererProfile, WebGLParameterProfile } from './models';

export const WEBGL_PROFILES: Record<string, WebGLParameterProfile> = {
    'nvidia_rtx_series': {
        id: 'nvidia_rtx_series',
        maxTextureSize: 32768,
        maxViewportDims: [32768, 32768],
        maxRenderbufferSize: 32768,
        shaderPrecisionValues: {
            'VERTEX_SHADER.HIGH_FLOAT': '23, 23, 127',
            'FRAGMENT_SHADER.HIGH_FLOAT': '23, 23, 127'
        },
        supportedExtensions: [
            'ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_color_buffer_half_float',
            'EXT_disjoint_timer_query', 'EXT_float_blend', 'EXT_frag_depth',
            'EXT_shader_texture_lod', 'EXT_texture_compression_bptc',
            'EXT_texture_filter_anisotropic', 'OES_element_index_uint',
            'OES_standard_derivatives', 'OES_texture_float', 'OES_texture_float_linear',
            'OES_texture_half_float', 'OES_texture_half_float_linear', 'OES_vertex_array_object',
            'WEBGL_color_buffer_float', 'WEBGL_compressed_texture_s3tc',
            'WEBGL_compressed_texture_s3tc_srgb', 'WEBGL_debug_renderer_info',
            'WEBGL_debug_shaders', 'WEBGL_depth_texture', 'WEBGL_draw_buffers',
            'WEBGL_lose_context', 'WEBGL_multi_draw'
        ]
    },
    'apple_silicon_series': {
        id: 'apple_silicon_series',
        maxTextureSize: 16384,
        maxViewportDims: [16384, 16384],
        maxRenderbufferSize: 16384,
        shaderPrecisionValues: {
            'VERTEX_SHADER.HIGH_FLOAT': '23, 23, 127',
            'FRAGMENT_SHADER.HIGH_FLOAT': '23, 23, 127'
        },
        supportedExtensions: [
            'ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_color_buffer_half_float',
            'EXT_float_blend', 'EXT_frag_depth', 'EXT_shader_texture_lod',
            'OES_element_index_uint', 'OES_standard_derivatives', 'OES_texture_float',
            'OES_texture_float_linear', 'OES_texture_half_float', 'OES_texture_half_float_linear',
            'OES_vertex_array_object', 'WEBGL_color_buffer_float', 'WEBGL_compressed_texture_astc',
            'WEBGL_compressed_texture_etc', 'WEBGL_debug_renderer_info', 'WEBGL_debug_shaders',
            'WEBGL_depth_texture', 'WEBGL_draw_buffers', 'WEBGL_lose_context', 'WEBGL_multi_draw'
        ]
    }
};

export const GPU_DATABASE: GPURendererProfile[] = [
    {
        vendorId: 'nvidia',
        vendorString: 'Google Inc. (NVIDIA)',
        rendererString: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        compatibleOS: ['Windows 10', 'Windows 11', 'Linux'],
        webglProfileId: 'nvidia_rtx_series',
        marketShareWeight: 0.15
    },
    {
        vendorId: 'nvidia',
        vendorString: 'Google Inc. (NVIDIA)',
        rendererString: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        compatibleOS: ['Windows 10', 'Windows 11', 'Linux'],
        webglProfileId: 'nvidia_rtx_series',
        marketShareWeight: 0.10
    },
    {
        vendorId: 'intel',
        vendorString: 'Google Inc. (Intel)',
        rendererString: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
        compatibleOS: ['Windows 10', 'Windows 11', 'Linux'],
        webglProfileId: 'nvidia_rtx_series', // Shares generic high-end params in this mock
        marketShareWeight: 0.30
    },
    {
        vendorId: 'apple',
        vendorString: 'Google Inc. (Apple)',
        rendererString: 'ANGLE (Apple, Apple M1, OpenGL 4.1)',
        compatibleOS: ['macOS Ventura', 'macOS Sonoma'],
        webglProfileId: 'apple_silicon_series',
        marketShareWeight: 0.20
    },
    {
        vendorId: 'apple_mobile',
        vendorString: 'Apple Inc.',
        rendererString: 'Apple A16 GPU',
        compatibleOS: ['iOS 16', 'iOS 17'],
        webglProfileId: 'apple_silicon_series',
        marketShareWeight: 0.20
    },
    {
        vendorId: 'qualcomm',
        vendorString: 'Google Inc. (Qualcomm)',
        rendererString: 'ANGLE (Qualcomm, Adreno (TM) 740, OpenGL ES 3.2)',
        compatibleOS: ['Android 13', 'Android 14'],
        webglProfileId: 'nvidia_rtx_series', // Fallback for ARM mock
        marketShareWeight: 0.05
    }
];
